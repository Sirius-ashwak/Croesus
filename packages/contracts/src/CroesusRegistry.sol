// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CroesusVault} from "./CroesusVault.sol";
import {CroesusStream} from "./CroesusStream.sol";
import {MezoBorrowAdapter} from "./adapters/MezoBorrowAdapter.sol";

/**
 * @title CroesusRegistry
 * @notice Singleton registry + factory. Deploys a CroesusVault + CroesusStream pair per
 *         organization and records the mapping. Entry point for the frontend to discover
 *         org state. Holds the Mezo protocol config so every vault is wired consistently.
 * @dev Deploy order matters: the Stream is deployed first so the Vault can take its address
 *      as an immutable `streamContract` (set-once authorization, PRD §13.1).
 *
 *      Two borrow-provider modes, chosen at construction:
 *      - Mock mode (`mezoOps == 0`): every vault shares the single `mezoBorrow` (MockMezoBorrow),
 *        which keys collateral/debt by caller. Used on anvil.
 *      - Mezo mode (`mezoOps != 0`): a fresh MezoBorrowAdapter is deployed PER org (it owns that
 *        org's trove) and wired as the vault's borrow provider. Used on Mezo testnet/mainnet.
 */
contract CroesusRegistry {
    struct Organization {
        address owner;
        address vault;
        address stream;
        string name;
        uint256 createdAt;
    }

    // Borrow/oracle config (immutable). In Mezo mode, mezoOps/mezoTroveManager drive a per-org
    // adapter and `mezoBorrow` is unused; in mock mode, `mezoBorrow` is the shared mock.
    address public immutable mezoBorrow;
    address public immutable mezoOps; // BorrowerOperations (0 in mock mode)
    address public immutable mezoTroveManager; // TroveManager (0 in mock mode)
    address public immutable musdToken;
    address public immutable tbtcToken;
    address public immutable pythOracle;
    bytes32 public immutable btcUsdPriceId;

    mapping(address => Organization) public organizations;
    address[] public orgList;

    event OrganizationRegistered(address indexed owner, address vault, address stream, string name);

    constructor(
        address _mezoBorrow,
        address _mezoOps,
        address _mezoTroveManager,
        address _musd,
        address _tbtc,
        address _pyth,
        bytes32 _priceId
    ) {
        mezoBorrow = _mezoBorrow;
        mezoOps = _mezoOps;
        mezoTroveManager = _mezoTroveManager;
        musdToken = _musd;
        tbtcToken = _tbtc;
        pythOracle = _pyth;
        btcUsdPriceId = _priceId;
    }

    /// @notice Deploys and registers a vault+stream pair for msg.sender. Called once per org.
    function registerOrganization(string calldata name) external returns (address vault, address stream) {
        require(organizations[msg.sender].owner == address(0), "Registry: already registered");

        CroesusStream streamC = new CroesusStream();

        // Pick the borrow provider: a per-org adapter on Mezo, the shared mock otherwise.
        address borrow = mezoBorrow;
        MezoBorrowAdapter adapter;
        if (mezoOps != address(0)) {
            adapter = new MezoBorrowAdapter(mezoOps, mezoTroveManager, musdToken);
            borrow = address(adapter);
        }

        CroesusVault vaultC =
            new CroesusVault(msg.sender, borrow, musdToken, tbtcToken, pythOracle, btcUsdPriceId, address(streamC));

        // Wire the per-org adapter to its vault (one-time), now that the vault address exists.
        if (address(adapter) != address(0)) adapter.setVault(address(vaultC));

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
