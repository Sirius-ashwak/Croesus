// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./utils/Base.t.sol";
import {CroesusVault} from "../src/CroesusVault.sol";

contract CroesusVaultTest is Base {
    uint256 constant BTC = 1.5e18; // 1.5 tBTC
    uint256 constant BORROW = 25_000e18; // $25,000 MUSD

    function testDepositCollateral_success() public {
        _depositAndBorrow(BTC, 0);
        assertEq(mezo.collateralOf(address(vault)), BTC, "collateral credited");
        assertEq(vault.getCollateralRatio(), type(uint256).max, "no debt => infinite ratio");
    }

    function testDepositCollateral_insufficientBalance_reverts() public {
        // Approve without minting -> transferFrom fails.
        tbtc.approve(address(vault), BTC);
        vm.expectRevert();
        vault.depositCollateral(BTC);
    }

    function testBorrowMUSD_belowMinRatio_reverts() public {
        _depositAndBorrow(BTC, 0);
        // Max borrow at 150% on $112,200 collateral is $74,800. $75,000 must revert.
        vm.expectRevert(bytes("Croesus: below min ratio"));
        vault.borrowMUSD(75_000e18);
    }

    function testBorrowMUSD_success_updatesRatio() public {
        _depositAndBorrow(BTC, BORROW);
        assertEq(musd.balanceOf(address(vault)), BORROW, "MUSD borrowed into vault balance");
        // ratio = 112200/25000 = 4.488 => 4.488e18
        assertEq(vault.getCollateralRatio(), 4.488e18, "ratio == 448.8%");
    }

    function testRepayMUSD_success() public {
        _depositAndBorrow(BTC, BORROW);
        uint256 ratioBefore = vault.getCollateralRatio();
        vault.repayMUSD(10_000e18);
        assertEq(mezo.debtOf(address(vault)), 15_000e18, "debt reduced");
        assertEq(musd.balanceOf(address(vault)), 15_000e18, "MUSD burned from vault on repay");
        assertGt(vault.getCollateralRatio(), ratioBefore, "ratio improves after repay");
    }

    function testWithdrawCollateral_wouldBreachMinRatio_reverts() public {
        _depositAndBorrow(BTC, BORROW);
        // Withdrawing nearly all collateral would breach the 150% floor.
        vm.expectRevert(bytes("Croesus: would breach min ratio"));
        vault.withdrawCollateral(1.4e18);
    }

    function testWithdrawCollateral_success() public {
        _depositAndBorrow(BTC, BORROW);
        uint256 maxW = vault.getMaxWithdrawable();
        assertGt(maxW, 0, "some collateral withdrawable");
        uint256 balBefore = tbtc.balanceOf(address(this));
        vault.withdrawCollateral(maxW);
        assertEq(tbtc.balanceOf(address(this)), balBefore + maxW, "tBTC returned to owner");
        // After withdrawing the max, ratio sits at the 150% floor (allow rounding dust).
        assertApproxEqAbs(vault.getCollateralRatio(), vault.CROESUS_MIN_RATIO(), 1e12);
    }

    function testGetLiquidationPrice_usesMezoRatio_notCroesusGuard() public {
        _depositAndBorrow(BTC, BORROW);
        // Mezo 110%: price where 1.5*price = 25000*1.1 => price = 18,333.33 (8dp)
        uint256 expected = (BORROW * vault.MEZO_LIQUIDATION_RATIO() / 1e18) * 1e8 / BTC;
        assertEq(vault.getLiquidationPrice(), expected, "liq price uses Mezo 110% ratio");
        // ~ $18,333
        assertApproxEqAbs(vault.getLiquidationPrice() / 1e8, 18_333, 1);
    }

    function testGetMarginCallPrice_alwaysAboveLiquidationPrice() public {
        _depositAndBorrow(BTC, BORROW);
        assertGt(vault.getMarginCallPrice(), vault.getLiquidationPrice(), "margin-call above liquidation");
        // margin-call (150%) ~ $25,000
        assertApproxEqAbs(vault.getMarginCallPrice() / 1e8, 25_000, 1);
    }

    function testGetCollateralRatio_zeroDebt_returnsMax() public {
        _depositAndBorrow(BTC, 0);
        assertEq(vault.getCollateralRatio(), type(uint256).max);
    }

    function testFundStream_transfersFromBalance_doesNotMint() public {
        _depositAndBorrow(BTC, BORROW);
        uint256 supplyBefore = musd.totalSupply();
        vault.fundStream(1_000e18, recipient);
        assertEq(musd.balanceOf(recipient), 1_000e18, "recipient paid");
        assertEq(musd.balanceOf(address(vault)), BORROW - 1_000e18, "paid from vault balance");
        assertEq(musd.totalSupply(), supplyBefore, "no mint occurred");
    }

    function testFundStream_insufficientBalance_reverts() public {
        _depositAndBorrow(BTC, 0); // vault holds no MUSD
        vm.expectRevert(bytes("Croesus: stream underfunded"));
        vault.fundStream(1_000e18, recipient);
    }

    function testFundStream_onlyOwnerOrStream() public {
        _depositAndBorrow(BTC, BORROW);
        vm.prank(recipient);
        vm.expectRevert(bytes("Croesus: unauthorized caller"));
        vault.fundStream(1_000e18, recipient);
    }

    function testFuzz_collateralRatioCalculation(uint96 btcAmount, uint96 borrowAmount) public {
        uint256 btc = bound(uint256(btcAmount), 1e15, 1_000e18);
        _setBtcPrice(74_800);
        // collateral value (18dp) and max borrow at 150%
        uint256 colValue = btc * 74_800; // (btc/1e18)*74800*1e18
        uint256 maxBorrow = colValue / 15 * 10; // colValue / 1.5
        uint256 borrowAmt = bound(uint256(borrowAmount), 1e18, maxBorrow == 0 ? 1e18 : maxBorrow);
        vm.assume(borrowAmt <= maxBorrow);

        _depositAndBorrow(btc, borrowAmt);
        uint256 expected = colValue * 1e18 / borrowAmt;
        assertApproxEqRel(vault.getCollateralRatio(), expected, 1e12); // within 1e-6
    }
}
