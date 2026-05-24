// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IMezoBorrow} from "../interfaces/IMezoBorrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title MockMezoBorrow
 * @notice Mocks-first stand-in for Mezo Borrow. Holds NATIVE collateral (matching Mezo, where
 *         collateral is native BTC) and mints/burns MUSD to represent debt, keyed per calling
 *         account (a CroesusVault). This is NOT Mezo's real trove/liquidation/interest logic —
 *         it exists so the full Croesus flow runs locally on anvil (native gas asset = ETH).
 * @dev The `tbtc` field is retained only so the constructor/wiring matches the token-based
 *      deployments; it is no longer used as collateral.
 */
contract MockMezoBorrow is IMezoBorrow {
    MockERC20 public immutable musd;
    IERC20 public immutable tbtc; // vestigial: collateral is native, not this token

    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;

    constructor(MockERC20 _musd, IERC20 _tbtc) {
        musd = _musd;
        tbtc = _tbtc;
    }

    function depositCollateral(uint256 amount) external payable {
        require(amount > 0, "Mock: zero amount");
        require(msg.value == amount, "Mock: value != amount");
        collateral[msg.sender] += amount;
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "Mock: zero amount");
        debt[msg.sender] += amount;
        musd.mint(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "Mock: zero amount");
        uint256 d = debt[msg.sender];
        require(amount <= d, "Mock: over-repay");
        debt[msg.sender] = d - amount;
        musd.burn(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external {
        uint256 c = collateral[msg.sender];
        require(amount <= c, "Mock: over-withdraw");
        collateral[msg.sender] = c - amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Mock: BTC transfer failed");
    }

    function collateralOf(address account) external view returns (uint256) {
        return collateral[account];
    }

    function debtOf(address account) external view returns (uint256) {
        return debt[account];
    }
}
