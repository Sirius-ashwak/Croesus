// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "../interfaces/IPyth.sol";

/**
 * @title MockPyth
 * @notice Settable Pyth oracle for mocks-first development and demo control (R-02).
 *         `setPrice` lets the demo operator drive BTC/USD on-chain, mirroring the
 *         DEMO_BTC_PRICE_USD frontend override.
 */
contract MockPyth is IPyth {
    mapping(bytes32 => Price) internal _prices;

    function setPrice(bytes32 id, int64 price, int32 expo) external {
        _prices[id] = Price({price: price, conf: 0, expo: expo, publishTime: block.timestamp});
    }

    function getPriceUnsafe(bytes32 id) external view returns (Price memory) {
        Price memory p = _prices[id];
        require(p.publishTime != 0, "MockPyth: price unset");
        return p;
    }
}
