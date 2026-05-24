// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "../interfaces/IPyth.sol";
import {IMezoPriceFeed} from "../interfaces/IMezoProtocol.sol";

/**
 * @title MezoPriceFeedAdapter
 * @notice Exposes Mezo's own `PriceFeed.fetchPrice()` (18-decimal BTC/USD) through the
 *         Pyth-shaped `IPyth.getPriceUnsafe` the CroesusVault already reads, so the vault's
 *         oracle code is unchanged. This is the SAME feed Mezo settles liquidations on, which
 *         is exactly what getLiquidationPrice() should reflect (resolves R-09 / OQ-02).
 */
contract MezoPriceFeedAdapter is IPyth {
    IMezoPriceFeed public immutable priceFeed;

    constructor(address _priceFeed) {
        require(_priceFeed != address(0), "Oracle: zero feed");
        priceFeed = IMezoPriceFeed(_priceFeed);
    }

    /// @inheritdoc IPyth
    function getPriceUnsafe(bytes32) external view returns (Price memory p) {
        uint256 price18 = priceFeed.fetchPrice(); // BTC/USD, 18 decimals
        require(price18 > 0, "Oracle: bad price");
        // Down-scale 18dp -> 8dp so the value fits Pyth's int64 price field (expo -8).
        // ~1e13 for a $100k BTC price, far within int64 — the cast is bounded and safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        p.price = int64(int256(price18 / 1e10));
        p.conf = 0;
        p.expo = -8;
        p.publishTime = block.timestamp;
    }
}
