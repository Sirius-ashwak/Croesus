// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMezoBorrow} from "./interfaces/IMezoBorrow.sol";
import {IPyth} from "./interfaces/IPyth.sol";

/**
 * @title CroesusVault
 * @notice Wrapper around Mezo Borrow that adds organizational context, stream-funding
 *         authorization, and health monitoring. Deployed per organization by CroesusRegistry.
 * @dev Ratio convention: 1e18 == 100%. Croesus enforces a 150% margin-call/borrow guard;
 *      Mezo liquidates at ~110%. The two thresholds are never conflated:
 *      getMarginCallPrice() is always >= getLiquidationPrice().
 */
contract CroesusVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Immutable config ──────────────────────────────────────────────────
    address public immutable owner; // Organization treasury address
    address public immutable mezoBorrow; // Mezo Borrow contract
    address public immutable musdToken; // MUSD ERC-20
    address public immutable tbtcToken; // tBTC ERC-20
    address public immutable pythOracle; // Pyth oracle
    bytes32 public immutable btcUsdPriceId; // Pyth BTC/USD feed id
    address public immutable streamContract; // Authorized CroesusStream (set at deploy, §13.1)

    // ─── Constants (1e18 == 100%) ───────────────────────────────────────────
    uint256 public constant CROESUS_MIN_RATIO = 1.5e18; // 150% margin-call / borrow guard
    uint256 public constant SAFE_RATIO = 2e18; // 200% recommended
    uint256 public constant MEZO_LIQUIDATION_RATIO = 1.1e18; // ~110% Mezo MCR (OQ-03)
    uint256 public constant PRECISION = 1e18;
    uint256 private constant PRICE_DECIMALS = 1e8; // Pyth/USD precision used internally

    // ─── Events ──────────────────────────────────────────────────────────────
    event CollateralDeposited(address indexed org, uint256 amount, uint256 newRatio);
    event MUSDMinted(address indexed org, uint256 amount, uint256 newRatio);
    event MUSDRepaid(address indexed org, uint256 amount, uint256 newRatio);
    event CollateralWithdrawn(address indexed org, uint256 amount, uint256 newRatio);
    event HealthAlert(address indexed org, uint256 ratio, uint8 severity);
    event StreamAuthorized(address indexed streamContract);

    // ─── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Croesus: not vault owner");
        _;
    }

    modifier onlyOwnerOrStream() {
        require(msg.sender == owner || msg.sender == streamContract, "Croesus: unauthorized caller");
        _;
    }

    constructor(
        address _owner,
        address _mezoBorrow,
        address _musd,
        address _tbtc,
        address _pyth,
        bytes32 _priceId,
        address _stream
    ) {
        require(_owner != address(0), "Croesus: zero owner");
        owner = _owner;
        mezoBorrow = _mezoBorrow;
        musdToken = _musd;
        tbtcToken = _tbtc;
        pythOracle = _pyth;
        btcUsdPriceId = _priceId;
        streamContract = _stream;
        emit StreamAuthorized(_stream);
    }

    // ─── Core ────────────────────────────────────────────────────────────────

    /// @notice Deposits tBTC collateral into Mezo Borrow.
    function depositCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Croesus: zero amount");
        IERC20(tbtcToken).safeTransferFrom(owner, address(this), amount);
        IERC20(tbtcToken).forceApprove(mezoBorrow, amount);
        IMezoBorrow(mezoBorrow).depositCollateral(amount);
        emit CollateralDeposited(owner, amount, getCollateralRatio());
    }

    /// @notice Borrows MUSD into the vault balance (the pool that funds streams).
    ///         Enforces the Croesus 150% floor.
    function borrowMUSD(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Croesus: zero amount");
        uint256 newDebt = _debt() + amount;
        require(_ratioAt(_collateralValueUSD(), newDebt) >= CROESUS_MIN_RATIO, "Croesus: below min ratio");
        IMezoBorrow(mezoBorrow).borrow(amount);
        emit MUSDMinted(owner, amount, getCollateralRatio());
    }

    /// @notice Repays MUSD to Mezo Borrow from the vault balance.
    function repayMUSD(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Croesus: zero amount");
        require(amount <= _debt(), "Croesus: over-repay");
        IERC20(musdToken).forceApprove(mezoBorrow, amount);
        IMezoBorrow(mezoBorrow).repay(amount);
        emit MUSDRepaid(owner, amount, getCollateralRatio());
    }

    /// @notice Withdraws tBTC collateral, keeping the position at/above the 150% floor.
    function withdrawCollateral(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Croesus: zero amount");
        require(amount <= getMaxWithdrawable(), "Croesus: would breach min ratio");
        IMezoBorrow(mezoBorrow).withdrawCollateral(amount);
        IERC20(tbtcToken).safeTransfer(owner, amount);
        emit CollateralWithdrawn(owner, amount, getCollateralRatio());
    }

    /// @notice Pays out already-borrowed MUSD to a stream claimant. TRANSFERS, never mints.
    ///         Reverts if the vault balance is insufficient (stream shows "underfunded").
    function fundStream(uint256 amount, address to) external onlyOwnerOrStream nonReentrant {
        require(to != address(0), "Croesus: zero recipient");
        require(IERC20(musdToken).balanceOf(address(this)) >= amount, "Croesus: stream underfunded");
        IERC20(musdToken).safeTransfer(to, amount);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @return ratio Current collateral ratio (1e18 == 100%); type(uint256).max when debt==0.
    function getCollateralRatio() public view returns (uint256 ratio) {
        uint256 d = _debt();
        if (d == 0) return type(uint256).max;
        return _ratioAt(_collateralValueUSD(), d);
    }

    /// @return price BTC/USD price (8 decimals) at which MEZO liquidates (~110% MCR).
    function getLiquidationPrice() external view returns (uint256 price) {
        return _priceAtRatio(MEZO_LIQUIDATION_RATIO);
    }

    /// @return price BTC/USD price (8 decimals) at which the Croesus 150% margin call hits.
    ///         Always >= getLiquidationPrice().
    function getMarginCallPrice() external view returns (uint256 price) {
        return _priceAtRatio(CROESUS_MIN_RATIO);
    }

    /// @return available Additional MUSD borrowable while staying at/above the 150% floor.
    function getAvailableBorrowCapacity() public view returns (uint256 available) {
        uint256 maxDebt = (_collateralValueUSD() * PRECISION) / CROESUS_MIN_RATIO;
        uint256 d = _debt();
        return maxDebt > d ? maxDebt - d : 0;
    }

    /// @return maxWithdraw Maximum tBTC withdrawable while staying at/above the 150% floor.
    function getMaxWithdrawable() public view returns (uint256 maxWithdraw) {
        uint256 col = _collateral();
        uint256 d = _debt();
        if (d == 0) return col;
        uint256 minColValue = (d * CROESUS_MIN_RATIO) / PRECISION; // required USD value (18dp)
        uint256 minColBtc = (minColValue * PRICE_DECIMALS) / _btcPrice8(); // required tBTC (18dp)
        return col > minColBtc ? col - minColBtc : 0;
    }

    /// @return btcPrice Current BTC/USD price from the oracle (8 decimals).
    function getBTCPrice() public view returns (uint256 btcPrice) {
        return _btcPrice8();
    }

    // ─── Internal helpers ──────────────────────────────────────────────────

    function _collateral() internal view returns (uint256) {
        return IMezoBorrow(mezoBorrow).collateralOf(address(this));
    }

    function _debt() internal view returns (uint256) {
        return IMezoBorrow(mezoBorrow).debtOf(address(this));
    }

    /// @return USD value of collateral (18 decimals).
    function _collateralValueUSD() internal view returns (uint256) {
        return (_collateral() * _btcPrice8()) / PRICE_DECIMALS;
    }

    function _ratioAt(uint256 colValueUSD, uint256 debtAmt) internal pure returns (uint256) {
        if (debtAmt == 0) return type(uint256).max;
        return (colValueUSD * PRECISION) / debtAmt;
    }

    /// @return BTC/USD price (8 decimals) at which the ratio equals `ratio`.
    function _priceAtRatio(uint256 ratio) internal view returns (uint256) {
        uint256 col = _collateral();
        uint256 d = _debt();
        if (col == 0 || d == 0) return 0;
        // col * price / 1e8 == d * ratio / 1e18  =>  price = (d*ratio/1e18) * 1e8 / col
        return (((d * ratio) / PRECISION) * PRICE_DECIMALS) / col;
    }

    /// @return BTC/USD price normalized to 8 decimals from the Pyth feed.
    function _btcPrice8() internal view returns (uint256) {
        IPyth.Price memory p = IPyth(pythOracle).getPriceUnsafe(btcUsdPriceId);
        require(p.price > 0, "Croesus: bad oracle price");
        uint256 price = uint256(uint64(p.price));
        int32 expo = p.expo;
        if (expo == -8) return price;
        if (expo > -8) {
            // expo+8 is a small positive exponent; cast is bounded and safe.
            // forge-lint: disable-next-line(unsafe-typecast)
            return price * (10 ** uint256(int256(expo + 8)));
        }
        // -8-expo is a small positive exponent; cast is bounded and safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return price / (10 ** uint256(int256(-8 - expo)));
    }
}
