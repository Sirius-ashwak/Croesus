// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CroesusRegistry} from "../../src/CroesusRegistry.sol";
import {CroesusVault} from "../../src/CroesusVault.sol";
import {CroesusStream} from "../../src/CroesusStream.sol";
import {MockMUSD, MockTBTC} from "../../src/mocks/MockERC20.sol";
import {MockMezoBorrow} from "../../src/mocks/MockMezoBorrow.sol";
import {MockPyth} from "../../src/mocks/MockPyth.sol";

/**
 * @notice Shared test fixture. The test contract itself is the org owner, so vault-owner
 *         calls are plain calls and recipient calls use vm.prank. Canonical demo dataset:
 *         1.5 tBTC @ $74,800, borrow $25,000 -> ~449% ratio, margin-call ~$25k, liq ~$18,333.
 */
abstract contract Base is Test {
    MockMUSD internal musd;
    MockTBTC internal tbtc;
    MockMezoBorrow internal mezo;
    MockPyth internal pyth;
    CroesusRegistry internal registry;
    CroesusVault internal vault;
    CroesusStream internal stream;

    bytes32 internal constant PRICE_ID = bytes32(uint256(0xB7C));
    address internal recipient = makeAddr("recipient");
    address internal recipient2 = makeAddr("recipient2");

    function setUp() public virtual {
        musd = new MockMUSD();
        tbtc = new MockTBTC();
        mezo = new MockMezoBorrow(musd, tbtc);
        pyth = new MockPyth();
        _setBtcPrice(74_800);

        registry = new CroesusRegistry(address(mezo), address(musd), address(tbtc), address(pyth), PRICE_ID);
        (address v, address s) = registry.registerOrganization("Test DAO");
        vault = CroesusVault(v);
        stream = CroesusStream(s);
    }

    /// @dev Sets BTC/USD to `usd` dollars at 8-decimal Pyth precision.
    function _setBtcPrice(uint256 usd) internal {
        pyth.setPrice(PRICE_ID, int64(int256(usd * 1e8)), -8);
    }

    /// @dev Deposits `btcAmount` tBTC (minted to this contract) and optionally borrows MUSD.
    function _depositAndBorrow(uint256 btcAmount, uint256 borrowAmount) internal {
        tbtc.mint(address(this), btcAmount);
        tbtc.approve(address(vault), btcAmount);
        vault.depositCollateral(btcAmount);
        if (borrowAmount > 0) vault.borrowMUSD(borrowAmount);
    }
}
