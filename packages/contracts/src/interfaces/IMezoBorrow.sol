// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMezoBorrow
 * @notice Minimal interface for Mezo's Borrow primitive as consumed by CroesusVault.
 * @dev The real Mezo Borrow ABI is pending OQ-01; `MockMezoBorrow` implements this
 *      for mocks-first development. Accounting is keyed by the calling account
 *      (a per-org CroesusVault is the position holder).
 */
interface IMezoBorrow {
    /// @notice Pulls `amount` tBTC from the caller and credits it as collateral.
    function depositCollateral(uint256 amount) external;

    /// @notice Borrows `amount` MUSD against the caller's collateral (MUSD sent to caller).
    function borrow(uint256 amount) external;

    /// @notice Repays `amount` of the caller's MUSD debt.
    function repay(uint256 amount) external;

    /// @notice Returns `amount` tBTC collateral to the caller.
    function withdrawCollateral(uint256 amount) external;

    /// @return The caller-account's deposited collateral (tBTC, 18 decimals).
    function collateralOf(address account) external view returns (uint256);

    /// @return The caller-account's outstanding MUSD debt (18 decimals).
    function debtOf(address account) external view returns (uint256);
}
