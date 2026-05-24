// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Mezo MUSD protocol interfaces (matsnet)
 * @notice Minimal subsets of Mezo's real MUSD trove system, consumed by the Croesus adapters.
 *         Signatures verified against mezo-org/musd deployment artifacts (chainId 31611).
 *         Mezo's MUSD is a Liquity/Threshold-USD fork; collateral is the chain's NATIVE asset
 *         (BTC), so openTrove/addColl are payable.
 */

/// @notice BorrowerOperations — the write surface for managing a trove.
interface IMezoBorrowerOperations {
    /// @dev Opens a trove drawing `_debtAmount` MUSD, collateralized by msg.value (native BTC).
    ///      Reverts if `_debtAmount` is below Mezo's minimum net debt.
    function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) external payable;

    /// @dev Adds msg.value (native BTC) as collateral to the caller's existing trove.
    function addColl(address _upperHint, address _lowerHint) external payable;

    /// @dev Withdraws `_amount` of native BTC collateral from the caller's trove.
    function withdrawColl(uint256 _amount, address _upperHint, address _lowerHint) external;

    /// @dev Draws an additional `_amount` of MUSD against the caller's trove.
    function withdrawMUSD(uint256 _amount, address _upperHint, address _lowerHint) external;

    /// @dev Repays `_amount` of MUSD debt (burned from the caller).
    function repayMUSD(uint256 _amount, address _upperHint, address _lowerHint) external;

    /// @dev Closes the caller's trove (repays all debt, returns all collateral).
    function closeTrove() external;
}

/// @notice TroveManager — the read surface for a trove's current state.
interface IMezoTroveManager {
    /// @return The borrower's current collateral (native BTC, 18 decimals).
    function getTroveColl(address _borrower) external view returns (uint256);

    /// @return The borrower's current debt incl. accrued interest (MUSD, 18 decimals).
    function getTroveDebt(address _borrower) external view returns (uint256);

    /// @return status 0=nonExistent, 1=active, 2=closedByOwner, 3=closedByLiquidation, ...
    function getTroveStatus(address _borrower) external view returns (uint8);
}

/// @notice PriceFeed — Mezo's own BTC/USD oracle (the feed liquidations settle on).
interface IMezoPriceFeed {
    /// @return BTC/USD price, 18 decimals.
    function fetchPrice() external view returns (uint256);
}
