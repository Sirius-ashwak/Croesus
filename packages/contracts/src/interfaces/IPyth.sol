// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPyth
 * @notice Minimal subset of the Pyth EVM pull-oracle interface (field-compatible with
 *         PythStructs.Price). CroesusVault only needs to read the latest BTC/USD price.
 * @dev Production note (R-09 / OQ-02): Mezo's liquidation engine may settle on a different
 *      feed than the one read here. `getLiquidationPrice()` must ultimately read Mezo's
 *      settlement source. `MockPyth` implements this for mocks-first development.
 */
interface IPyth {
    struct Price {
        int64 price; // price scaled by 10^expo
        uint64 conf; // confidence interval
        int32 expo; // exponent (BTC/USD is typically -8)
        uint256 publishTime; // unix timestamp of the price
    }

    /// @notice Returns the most recent price without checking staleness.
    function getPriceUnsafe(bytes32 id) external view returns (Price memory);
}
