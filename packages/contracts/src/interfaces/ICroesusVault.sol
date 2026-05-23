// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICroesusVault
 * @notice The surface of CroesusVault that CroesusStream and CroesusRegistry rely on.
 */
interface ICroesusVault {
    function owner() external view returns (address);

    function streamContract() external view returns (address);

    /// @notice Transfers already-borrowed MUSD from the vault balance to `to` (does NOT mint).
    function fundStream(uint256 amount, address to) external;
}
