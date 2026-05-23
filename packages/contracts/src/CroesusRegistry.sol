// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CroesusVault} from "./CroesusVault.sol";
import {CroesusStream} from "./CroesusStream.sol";

/**
 * @title CroesusRegistry
 * @notice Singleton registry + factory. Deploys a CroesusVault + CroesusStream pair per
 *         organization and records the mapping. Entry point for the frontend to discover
 *         org state. Holds the Mezo protocol config so every vault is wired consistently.
 * @dev Deploy order matters: the Stream is deployed first so the Vault can take its address
 *      as an immutable `streamContract` (set-once authorization, PRD §13.1).
 */
contract CroesusRegistry {
    struct Organization {
        address owner;
        address vault;
        address stream;
        string name;
        uint256 createdAt;
    }

    // Mezo protocol config (immutable; pending OQ-01..05, mocks during development)
    address public immutable mezoBorrow;
    address public immutable musdToken;
    address public immutable tbtcToken;
    address public immutable pythOracle;
    bytes32 public immutable btcUsdPriceId;

    mapping(address => Organization) public organizations;
    address[] public orgList;

    event OrganizationRegistered(address indexed owner, address vault, address stream, string name);

    constructor(address _mezoBorrow, address _musd, address _tbtc, address _pyth, bytes32 _priceId) {
        mezoBorrow = _mezoBorrow;
        musdToken = _musd;
        tbtcToken = _tbtc;
        pythOracle = _pyth;
        btcUsdPriceId = _priceId;
    }

    /// @notice Deploys and registers a vault+stream pair for msg.sender. Called once per org.
    function registerOrganization(string calldata name) external returns (address vault, address stream) {
        require(organizations[msg.sender].owner == address(0), "Registry: already registered");

        CroesusStream streamC = new CroesusStream();
        CroesusVault vaultC =
            new CroesusVault(msg.sender, mezoBorrow, musdToken, tbtcToken, pythOracle, btcUsdPriceId, address(streamC));

        organizations[msg.sender] = Organization({
            owner: msg.sender,
            vault: address(vaultC),
            stream: address(streamC),
            name: name,
            createdAt: block.timestamp
        });
        orgList.push(msg.sender);

        emit OrganizationRegistered(msg.sender, address(vaultC), address(streamC), name);
        return (address(vaultC), address(streamC));
    }

    function getOrganization(address owner_) external view returns (Organization memory org) {
        org = organizations[owner_];
        require(org.owner != address(0), "Registry: not registered");
    }

    function isRegistered(address owner_) external view returns (bool registered) {
        return organizations[owner_].owner != address(0);
    }

    function orgCount() external view returns (uint256) {
        return orgList.length;
    }
}
