// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Test-only ERC20 with open mint/burn. NEVER deploy to production.
 *         Used as the mocks-first stand-in for MUSD and tBTC (R-02/R-03).
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _dec;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _dec = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _dec;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/// @notice Mock Mezo USD stablecoin (18 decimals).
contract MockMUSD is MockERC20 {
    constructor() MockERC20("Mezo USD (Mock)", "MUSD", 18) {}
}

/// @notice Mock Threshold tBTC (18 decimals).
contract MockTBTC is MockERC20 {
    constructor() MockERC20("tBTC (Mock)", "tBTC", 18) {}
}
