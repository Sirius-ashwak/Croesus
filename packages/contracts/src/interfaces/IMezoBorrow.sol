// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMezoBorrow
 * @notice Minimal interface for Mezo's Borrow primitive as consumed by CroesusVault.
 * @dev Mezo's MUSD borrowing is a trove/CDP system whose collateral is the chain's NATIVE
 *      asset (BTC). `MezoBorrowAdapter` implements this interface over the real
 *      BorrowerOperations + TroveManager; `MockMezoBorrow` implements it for local dev.
 *      Accounting is keyed by the calling account (a per-org CroesusVault is the holder).
 */
interface IMezoBorrow {
    /// @notice Credits `amount` of native BTC (sent as msg.value) as the caller's collateral.
    /// @dev Collateral is the native asset, so this is payable and msg.value must equal `amount`.
    function depositCollateral(uint256 amount) external payable;

    /// @notice Borrows `amount` MUSD against the caller's collateral (MUSD sent to caller).
    function borrow(uint256 amount) external;

    /// @notice Repays `amount` of the caller's MUSD debt.
    function repay(uint256 amount) external;

    /// @notice Returns `amount` of native BTC collateral to the caller.
    function withdrawCollateral(uint256 amount) external;

    /// @return The caller-account's deposited collateral (native BTC, 18 decimals).
    function collateralOf(address account) external view returns (uint256);

    /// @return The caller-account's outstanding MUSD debt (18 decimals).
    function debtOf(address account) external view returns (uint256);
}
