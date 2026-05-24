// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./utils/Base.t.sol";
import {CroesusRegistry} from "../src/CroesusRegistry.sol";
import {CroesusVault} from "../src/CroesusVault.sol";

contract CroesusRegistryTest is Base {
    function testRegisterOrg_success_deploysContracts() public {
        address alice = makeAddr("alice");
        vm.prank(alice);
        (address v, address s) = registry.registerOrganization("Alice DAO");

        assertTrue(registry.isRegistered(alice), "registered");
        CroesusVault av = CroesusVault(payable(v));
        assertEq(av.owner(), alice, "vault owner is registrant");
        assertEq(av.streamContract(), s, "vault wired to its stream");
        assertEq(av.mezoBorrow(), address(mezo), "mezo config propagated");
        assertEq(av.musdToken(), address(musd), "musd config propagated");

        CroesusRegistry.Organization memory org = registry.getOrganization(alice);
        assertEq(org.name, "Alice DAO");
        assertEq(org.vault, v);
        assertEq(org.stream, s);
    }

    function testRegisterOrg_duplicate_reverts() public {
        address alice = makeAddr("alice");
        vm.prank(alice);
        registry.registerOrganization("Alice DAO");

        vm.prank(alice);
        vm.expectRevert(bytes("Registry: already registered"));
        registry.registerOrganization("Alice DAO Again");
    }

    function testGetOrganization_notRegistered_reverts() public {
        vm.expectRevert(bytes("Registry: not registered"));
        registry.getOrganization(makeAddr("nobody"));
    }
}
