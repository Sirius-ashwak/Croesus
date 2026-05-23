// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./utils/Base.t.sol";

contract CroesusStreamTest is Base {
    // monthly chosen so ratePerSecond == 1e18 (1 MUSD/sec) for clean assertions.
    uint256 constant MONTHLY = 2_628_000e18;
    uint256 constant RATE = 1e18;

    function _fundVault() internal {
        // 10 tBTC @ $74,800 = $748k collateral; borrow $100k into the vault balance.
        _depositAndBorrow(10e18, 100_000e18);
    }

    function _create(address to) internal returns (uint256 id) {
        id = stream.createStream(address(vault), to, MONTHLY, 0);
    }

    function testCreateStream_success() public {
        uint256 id = _create(recipient);
        (address org, address rcpt, uint256 monthly,,,,,,,) = stream.streams(id);
        assertEq(org, address(vault), "org is vault");
        assertEq(rcpt, recipient, "recipient stored");
        assertEq(monthly, MONTHLY, "monthly stored");
        assertEq(stream.getRatePerSecond(id), RATE, "rate per second");
        assertEq(stream.getOrgStreams(address(vault)).length, 1, "indexed under org");
        assertEq(stream.getRecipientStreams(recipient).length, 1, "indexed under recipient");
    }

    function testCreateStream_invalidRecipient_reverts() public {
        vm.expectRevert(bytes("Stream: zero recipient"));
        stream.createStream(address(vault), address(0), MONTHLY, 0);
    }

    function testCreateStream_notOwner_reverts() public {
        vm.prank(recipient);
        vm.expectRevert(bytes("Stream: not vault owner"));
        stream.createStream(address(vault), recipient, MONTHLY, 0);
    }

    function testGetAccruedBalance_linearAccrual() public {
        uint256 id = _create(recipient);
        skip(100);
        assertEq(stream.getAccruedBalance(id), 100 * RATE, "100s of linear accrual");
        skip(50);
        assertEq(stream.getAccruedBalance(id), 150 * RATE, "accrual continues linearly");
    }

    function testClaim_success_transfersMUSD() public {
        _fundVault();
        uint256 id = _create(recipient);
        skip(100);
        uint256 vaultBefore = musd.balanceOf(address(vault));

        vm.prank(recipient);
        stream.claim(id);

        assertEq(musd.balanceOf(recipient), 100 * RATE, "recipient received accrued MUSD");
        assertEq(musd.balanceOf(address(vault)), vaultBefore - 100 * RATE, "paid from vault balance");
        assertEq(stream.getAccruedBalance(id), 0, "claimable resets after claim");
    }

    function testClaim_paysOutViaVaultTransfer_noMint() public {
        _fundVault();
        uint256 id = _create(recipient);
        skip(100);
        uint256 supplyBefore = musd.totalSupply();

        vm.prank(recipient);
        stream.claim(id);

        assertEq(musd.totalSupply(), supplyBefore, "claim transfers, never mints");
    }

    function testClaim_notRecipient_reverts() public {
        _fundVault();
        uint256 id = _create(recipient);
        skip(100);
        vm.expectRevert(bytes("Stream: not recipient"));
        stream.claim(id); // called by address(this), not recipient
    }

    function testCancelStream_success() public {
        uint256 id = _create(recipient);
        skip(100);
        stream.cancelStream(id);
        uint256 frozen = stream.getAccruedBalance(id);
        assertEq(frozen, 100 * RATE, "accrual frozen at cancellation");
        skip(1000);
        assertEq(stream.getAccruedBalance(id), frozen, "no accrual after cancel");
    }

    function testCancelStream_claimableAfterExpiry_reverts() public {
        _fundVault();
        uint256 id = _create(recipient);
        skip(100);
        stream.cancelStream(id);
        skip(31 days); // beyond CLAIM_EXPIRY_DAYS

        vm.prank(recipient);
        vm.expectRevert(bytes("Stream: claim window expired"));
        stream.claim(id);
    }

    function testCancelStream_claimableWithinWindow() public {
        _fundVault();
        uint256 id = _create(recipient);
        skip(100);
        stream.cancelStream(id);
        skip(20 days); // within the 30-day window

        vm.prank(recipient);
        stream.claim(id);
        assertEq(musd.balanceOf(recipient), 100 * RATE, "claimable within window");
    }

    function testPauseStream_freezesAccrual() public {
        uint256 id = _create(recipient);
        skip(100);
        stream.pauseStream(id);
        uint256 atPause = stream.getAccruedBalance(id);
        assertEq(atPause, 100 * RATE);
        skip(100);
        assertEq(stream.getAccruedBalance(id), atPause, "no accrual while paused");
    }

    function testUnpauseStream_excludesPausedTime() public {
        uint256 id = _create(recipient);
        skip(100); // accrue 100
        stream.pauseStream(id);
        skip(100); // paused, no accrual
        stream.unpauseStream(id);
        skip(100); // accrue 100 more
        assertEq(stream.getAccruedBalance(id), 200 * RATE, "paused interval excluded");
    }

    function testClaimAll_multipleStreams() public {
        _fundVault();
        _create(recipient);
        _create(recipient);
        skip(100);

        vm.prank(recipient);
        stream.claimAll();
        assertEq(musd.balanceOf(recipient), 200 * RATE, "claimed both streams in one tx");
    }

    function testGetTotalMonthlyBurn_excludesCancelled() public {
        uint256 id1 = _create(recipient);
        _create(recipient2);
        assertEq(stream.getTotalMonthlyBurn(address(vault)), 2 * MONTHLY, "both counted");
        stream.cancelStream(id1);
        assertEq(stream.getTotalMonthlyBurn(address(vault)), MONTHLY, "cancelled excluded");
    }

    function testFuzz_accruedBalanceCalculation(uint256 monthly, uint32 t) public {
        monthly = bound(monthly, 2_628_000, 1e30); // ensure rate >= 1 wei/sec
        uint256 id = stream.createStream(address(vault), recipient, monthly, 0);
        skip(t);
        uint256 expected = (monthly / stream.SECONDS_PER_MONTH()) * uint256(t);
        assertEq(stream.getAccruedBalance(id), expected, "accrual == rate * elapsed");
    }
}
