// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICroesusVault} from "./interfaces/ICroesusVault.sol";

/**
 * @title CroesusStream
 * @notice Continuous per-second MUSD distribution to contributors. Linear vesting:
 *         recipient earns (monthlyAmount / SECONDS_PER_MONTH) per second from startTime
 *         until cancelled or paused.
 * @dev Holds no MUSD. On claim it calls CroesusVault.fundStream(amount, recipient), which
 *      TRANSFERS already-borrowed MUSD (never mints). `claimed` tracks lifetime payouts so
 *      accrual is `rate * activeElapsed - claimed` (per PRD §8.2 accrual reference).
 */
contract CroesusStream is ReentrancyGuard {
    struct Stream {
        address org; // organization vault address
        address recipient; // contributor wallet
        uint256 monthlyAmount; // MUSD per month (18 decimals)
        uint256 startTime; // unix start
        uint256 lastClaimedAt; // timestamp of last claim
        uint256 claimed; // lifetime MUSD claimed (18 decimals)
        uint256 cancelledAt; // 0 if active, else cancellation time
        uint256 pausedAt; // 0 if running, else current pause start
        uint256 pausedDuration; // cumulative paused seconds (excluded from accrual)
        bool active;
    }

    mapping(uint256 => Stream) public streams;
    mapping(address => uint256[]) public orgStreams; // vault => streamIds
    mapping(address => uint256[]) public recipientStreams; // recipient => streamIds
    uint256 public nextStreamId;

    uint256 public constant SECONDS_PER_MONTH = 2_628_000; // 30.4167 days — matches frontend
    uint256 public constant CLAIM_EXPIRY_DAYS = 30; // claim window after cancellation

    event StreamCreated(
        uint256 indexed streamId,
        address indexed org,
        address indexed recipient,
        uint256 monthlyAmount,
        uint256 startTime
    );
    event StreamCancelled(uint256 indexed streamId, uint256 finalAccrued);
    event StreamPaused(uint256 indexed streamId, uint256 pausedAt);
    event StreamResumed(uint256 indexed streamId, uint256 resumedAt);
    event Claimed(uint256 indexed streamId, address indexed recipient, uint256 amount);

    modifier onlyOrgOwner(uint256 streamId) {
        require(msg.sender == ICroesusVault(streams[streamId].org).owner(), "Stream: not org owner");
        _;
    }

    // ─── Core ────────────────────────────────────────────────────────────────

    function createStream(address vault, address recipient, uint256 monthly, uint256 startTime)
        external
        returns (uint256 streamId)
    {
        require(recipient != address(0), "Stream: zero recipient");
        require(monthly > 0, "Stream: zero amount");
        require(ICroesusVault(vault).streamContract() == address(this), "Stream: vault not wired");
        require(msg.sender == ICroesusVault(vault).owner(), "Stream: not vault owner");

        uint256 start = startTime == 0 ? block.timestamp : startTime;
        streamId = nextStreamId++;
        streams[streamId] = Stream({
            org: vault,
            recipient: recipient,
            monthlyAmount: monthly,
            startTime: start,
            lastClaimedAt: start,
            claimed: 0,
            cancelledAt: 0,
            pausedAt: 0,
            pausedDuration: 0,
            active: true
        });
        orgStreams[vault].push(streamId);
        recipientStreams[recipient].push(streamId);
        emit StreamCreated(streamId, vault, recipient, monthly, start);
    }

    function cancelStream(uint256 streamId) external onlyOrgOwner(streamId) {
        Stream storage s = streams[streamId];
        require(s.active, "Stream: not active");
        // settle any in-progress pause so the cancelled interval isn't double-counted
        if (s.pausedAt != 0) {
            s.pausedDuration += block.timestamp - s.pausedAt;
            s.pausedAt = 0;
        }
        s.cancelledAt = block.timestamp;
        s.active = false;
        emit StreamCancelled(streamId, getAccruedBalance(streamId));
    }

    function pauseStream(uint256 streamId) external onlyOrgOwner(streamId) {
        Stream storage s = streams[streamId];
        require(s.active, "Stream: not active");
        require(s.cancelledAt == 0, "Stream: cancelled");
        require(s.pausedAt == 0, "Stream: already paused");
        s.pausedAt = block.timestamp;
        emit StreamPaused(streamId, block.timestamp);
    }

    function unpauseStream(uint256 streamId) external onlyOrgOwner(streamId) {
        Stream storage s = streams[streamId];
        require(s.pausedAt != 0, "Stream: not paused");
        s.pausedDuration += block.timestamp - s.pausedAt;
        s.pausedAt = 0;
        emit StreamResumed(streamId, block.timestamp);
    }

    function claim(uint256 streamId) public nonReentrant {
        Stream storage s = streams[streamId];
        require(msg.sender == s.recipient, "Stream: not recipient");
        _claim(streamId, s);
    }

    function claimAll() external nonReentrant {
        uint256[] memory ids = recipientStreams[msg.sender];
        for (uint256 i = 0; i < ids.length; i++) {
            Stream storage s = streams[ids[i]];
            if (s.recipient == msg.sender && _isClaimable(s) && _accrued(s) > 0) {
                _claim(ids[i], s);
            }
        }
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    function getAccruedBalance(uint256 streamId) public view returns (uint256 accrued) {
        return _accrued(streams[streamId]);
    }

    function getRatePerSecond(uint256 streamId) external view returns (uint256 ratePerSecond) {
        return streams[streamId].monthlyAmount / SECONDS_PER_MONTH;
    }

    function getOrgStreams(address org) external view returns (uint256[] memory streamIds) {
        return orgStreams[org];
    }

    function getRecipientStreams(address recipient) external view returns (uint256[] memory streamIds) {
        return recipientStreams[recipient];
    }

    function getTotalMonthlyBurn(address org) external view returns (uint256 totalMonthly) {
        uint256[] memory ids = orgStreams[org];
        for (uint256 i = 0; i < ids.length; i++) {
            Stream storage s = streams[ids[i]];
            if (s.cancelledAt == 0) totalMonthly += s.monthlyAmount;
        }
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _claim(uint256 streamId, Stream storage s) internal {
        require(_isClaimable(s), "Stream: claim window expired");
        uint256 accrued = _accrued(s);
        require(accrued > 0, "Stream: nothing to claim");
        // checks-effects-interactions: update state before the external transfer
        s.claimed += accrued;
        s.lastClaimedAt = block.timestamp;
        ICroesusVault(s.org).fundStream(accrued, s.recipient);
        emit Claimed(streamId, s.recipient, accrued);
    }

    function _isClaimable(Stream storage s) internal view returns (bool) {
        if (s.cancelledAt == 0) return true;
        return block.timestamp <= s.cancelledAt + (CLAIM_EXPIRY_DAYS * 1 days);
    }

    function _accrued(Stream storage s) internal view returns (uint256) {
        if (s.startTime == 0) return 0; // non-existent stream
        uint256 rate = s.monthlyAmount / SECONDS_PER_MONTH;
        uint256 end = _effectiveEnd(s);
        if (end <= s.startTime) return 0;
        uint256 elapsed = end - s.startTime - s.pausedDuration;
        uint256 earned = rate * elapsed;
        return earned > s.claimed ? earned - s.claimed : 0;
    }

    function _effectiveEnd(Stream storage s) internal view returns (uint256) {
        if (s.cancelledAt != 0) return s.cancelledAt;
        if (s.pausedAt != 0) return s.pausedAt;
        return block.timestamp;
    }
}
