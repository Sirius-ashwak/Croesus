// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CroesusRegistry} from "../src/CroesusRegistry.sol";
import {MockMUSD, MockTBTC} from "../src/mocks/MockERC20.sol";
import {MockMezoBorrow} from "../src/mocks/MockMezoBorrow.sol";
import {MockPyth} from "../src/mocks/MockPyth.sol";

/**
 * @notice Mocks-first deployment: deploys the mock Mezo stack (MUSD, tBTC, Borrow, Pyth),
 *         seeds a BTC/USD price, then deploys CroesusRegistry wired to those mocks.
 *         Once OQ-01..05 are confirmed, swap the mock addresses for the real Mezo testnet
 *         addresses and deploy only the Registry.
 *
 * Usage (local):
 *   anvil &
 *   forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
 */
contract Deploy is Script {
    // Canonical Pyth BTC/USD feed id (PRD Appendix D).
    bytes32 constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    // anvil account #0 default key — local dev only.
    uint256 constant DEFAULT_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        uint256 pk = vm.envOr("DEPLOYER_PRIVATE_KEY", DEFAULT_KEY);
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        MockMUSD musd = new MockMUSD();
        MockTBTC tbtc = new MockTBTC();
        MockMezoBorrow mezo = new MockMezoBorrow(musd, tbtc);
        MockPyth pyth = new MockPyth();
        pyth.setPrice(BTC_USD_PRICE_ID, int64(int256(uint256(74_800) * 1e8)), -8);

        CroesusRegistry registry =
            new CroesusRegistry(address(mezo), address(musd), address(tbtc), address(pyth), BTC_USD_PRICE_ID);

        // Seed the deployer with test tBTC so the local UI can open a vault immediately.
        tbtc.mint(deployer, 100e18);

        vm.stopBroadcast();

        console2.log("== Croesus deployment (mocks-first) ==");
        console2.log("NEXT_PUBLIC_REGISTRY_ADDRESS    =", address(registry));
        console2.log("NEXT_PUBLIC_MEZO_BORROW_ADDRESS =", address(mezo));
        console2.log("NEXT_PUBLIC_MUSD_TOKEN_ADDRESS  =", address(musd));
        console2.log("NEXT_PUBLIC_TBTC_TOKEN_ADDRESS  =", address(tbtc));
        console2.log("NEXT_PUBLIC_PYTH_ORACLE_ADDRESS =", address(pyth));
        console2.log("deployer                        =", deployer);
    }
}
