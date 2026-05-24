// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CroesusRegistry} from "../src/CroesusRegistry.sol";
import {MezoPriceFeedAdapter} from "../src/adapters/MezoPriceFeedAdapter.sol";

/**
 * @notice Deploys Croesus onto Mezo matsnet (chainId 31611) wired to the REAL MUSD protocol —
 *         no mocks. The registry runs in "Mezo mode": each registerOrganization creates a
 *         per-org MezoBorrowAdapter over BorrowerOperations + TroveManager, and a single
 *         MezoPriceFeedAdapter wraps Mezo's PriceFeed behind the vault's IPyth oracle read.
 *
 * Usage (needs a REAL funded key — faucet BTC for gas; never the anvil key):
 *   DEPLOYER_PRIVATE_KEY=0x... forge script script/DeployMezo.s.sol \
 *     --rpc-url https://rpc.test.mezo.org --broadcast -vvvv
 *
 * Defaults are matsnet addresses from mezo-org/musd deployment artifacts; override via env.
 */
contract DeployMezo is Script {
    // ── Mezo matsnet (chainId 31611), verified against mezo-org/musd deployments ──
    address constant MUSD = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant BORROWER_OPERATIONS = 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5;
    address constant TROVE_MANAGER = 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0;
    address constant PRICE_FEED = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    // tBTC ERC-20 — reference only; trove collateral is NATIVE BTC.
    address constant TBTC = 0x517f2982701695D4E52f1ECFBEf3ba31Df470161;
    // Pyth BTC/USD feed id — kept for config parity (the PriceFeed adapter ignores the id).
    bytes32 constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address musd = vm.envOr("MEZO_MUSD", MUSD);
        address ops = vm.envOr("MEZO_BORROWER_OPERATIONS", BORROWER_OPERATIONS);
        address tm = vm.envOr("MEZO_TROVE_MANAGER", TROVE_MANAGER);
        address feed = vm.envOr("MEZO_PRICE_FEED", PRICE_FEED);
        address tbtc = vm.envOr("MEZO_TBTC", TBTC);

        vm.startBroadcast(pk);

        MezoPriceFeedAdapter oracle = new MezoPriceFeedAdapter(feed);

        // Mezo mode: pass ops + troveManager so the registry deploys a per-org adapter on each
        // registerOrganization. `mezoBorrow` (shared mock) is address(0) here.
        CroesusRegistry registry =
            new CroesusRegistry(address(0), ops, tm, musd, tbtc, address(oracle), BTC_USD_PRICE_ID);

        vm.stopBroadcast();

        console2.log("== Croesus on Mezo matsnet (chainId 31611) ==");
        console2.log("NEXT_PUBLIC_REGISTRY_ADDRESS    =", address(registry));
        console2.log("NEXT_PUBLIC_PYTH_ORACLE_ADDRESS =", address(oracle));
        console2.log("NEXT_PUBLIC_MUSD_TOKEN_ADDRESS  =", musd);
        console2.log("NEXT_PUBLIC_TBTC_TOKEN_ADDRESS  =", tbtc);
        console2.log("BorrowerOperations              =", ops);
        console2.log("TroveManager                    =", tm);
        console2.log("PriceFeed                       =", feed);
        console2.log("note: MEZO_BORROW_ADDRESS is per-org (the adapter) - read vault.mezoBorrow()");
    }
}
