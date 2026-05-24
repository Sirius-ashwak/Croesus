// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMezoBorrow} from "../interfaces/IMezoBorrow.sol";
import {IMezoBorrowerOperations, IMezoTroveManager} from "../interfaces/IMezoProtocol.sol";

/**
 * @title MezoBorrowAdapter
 * @notice Implements the Croesus `IMezoBorrow` facade over Mezo's real MUSD trove system
 *         (BorrowerOperations + TroveManager). ONE adapter is deployed per CroesusVault, so the
 *         adapter is the trove's borrower of record and reads its own trove via TroveManager.
 *
 * @dev Bridges two Mezo realities the simple facade hides:
 *      1. Collateral is NATIVE BTC — openTrove/addColl/withdrawColl move msg.value, not a token.
 *      2. A trove cannot be opened with zero debt (Mezo enforces a minimum net debt). So
 *         collateral deposited before any borrow is HELD in this adapter and only swept into a
 *         freshly-opened trove on the first borrow(). Sorted-list hints are passed as (0,0),
 *         which is correct (just less gas-optimal) on a low-population testnet.
 *
 *      Known MVP limitation: repay() uses repayMUSD and cannot take debt to zero (Mezo reserves
 *      a gas-compensation floor). Fully closing a position needs closeTrove() — TODO before
 *      production. Partial repayment works.
 */
contract MezoBorrowAdapter is IMezoBorrow {
    using SafeERC20 for IERC20;

    IMezoBorrowerOperations public immutable ops;
    IMezoTroveManager public immutable troveManager;
    IERC20 public immutable musd;
    address public immutable deployer; // the CroesusRegistry that created this adapter
    address public vault; // sole authorized caller (its CroesusVault), set once post-deploy

    bool public troveOpen;
    uint256 public pendingCollateral; // native BTC held before the trove is opened

    modifier onlyVault() {
        require(msg.sender == vault, "Adapter: not vault");
        _;
    }

    constructor(address _ops, address _troveManager, address _musd) {
        ops = IMezoBorrowerOperations(_ops);
        troveManager = IMezoTroveManager(_troveManager);
        musd = IERC20(_musd);
        deployer = msg.sender;
    }

    /// @notice Wires this adapter to its vault. Called once by the registry in the same tx that
    ///         creates the vault (breaks the vault<->adapter immutable-address cycle).
    function setVault(address _vault) external {
        require(msg.sender == deployer, "Adapter: not deployer");
        require(vault == address(0), "Adapter: vault set");
        require(_vault != address(0), "Adapter: zero vault");
        vault = _vault;
    }

    /// @notice Accept native BTC returned by withdrawColl (then forwarded to the vault).
    receive() external payable {}

    /// @inheritdoc IMezoBorrow
    function depositCollateral(uint256 amount) external payable onlyVault {
        require(msg.value == amount, "Adapter: value != amount");
        if (troveOpen) {
            ops.addColl{value: amount}(address(0), address(0));
        } else {
            pendingCollateral += amount; // hold until the first borrow opens the trove
        }
    }

    /// @inheritdoc IMezoBorrow
    function borrow(uint256 amount) external onlyVault {
        if (troveOpen) {
            ops.withdrawMUSD(amount, address(0), address(0));
        } else {
            uint256 coll = pendingCollateral;
            pendingCollateral = 0;
            troveOpen = true;
            // Reverts if `amount` is below Mezo's minimum net debt — enforce a floor in the UI.
            ops.openTrove{value: coll}(amount, address(0), address(0));
        }
        musd.safeTransfer(vault, amount); // forward the drawn MUSD to the vault's pool
    }

    /// @inheritdoc IMezoBorrow
    function repay(uint256 amount) external onlyVault {
        musd.safeTransferFrom(vault, address(this), amount); // vault forceApprove'd us
        ops.repayMUSD(amount, address(0), address(0));
    }

    /// @inheritdoc IMezoBorrow
    function withdrawCollateral(uint256 amount) external onlyVault {
        if (troveOpen) {
            ops.withdrawColl(amount, address(0), address(0)); // native BTC arrives via receive()
        } else {
            require(amount <= pendingCollateral, "Adapter: over-withdraw");
            pendingCollateral -= amount;
        }
        (bool ok,) = vault.call{value: amount}("");
        require(ok, "Adapter: BTC transfer failed");
    }

    /// @inheritdoc IMezoBorrow
    function collateralOf(address) external view returns (uint256) {
        return pendingCollateral + (troveOpen ? troveManager.getTroveColl(address(this)) : 0);
    }

    /// @inheritdoc IMezoBorrow
    function debtOf(address) external view returns (uint256) {
        return troveOpen ? troveManager.getTroveDebt(address(this)) : 0;
    }
}
