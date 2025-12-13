// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PinV} from "../src/PinV.sol";
import {PinVStore} from "../src/PinVStore.sol";
import {Config} from "../src/Config.sol";

contract PinVTest is Test {
    PinV pinV;
    PinVStore pinVStoreImpl;

    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);

    function setUp() public {
        vm.startPrank(owner);
        pinVStoreImpl = new PinVStore();
        Config.ConfigData memory config = Config.ConfigData({
            initialMintPrice: 0.01 ether,
            minSecondaryMintPrice: 0.005 ether,
            secondaryMintFeeBps: 500, // 5%
            tradingFeeBps: 250 // 2.5%
        });
        pinV = new PinV(address(pinVStoreImpl), config);
        vm.stopPrank();
    }

    function testMint() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);

        (uint256 initialMintPrice, , , ) = pinV.config();
        uint256 mintPrice = initialMintPrice;
        pinV.mint{value: mintPrice}(
            user1,
            "My First Pin",
            "The coolest pin ever",
            "QmHash123",
            ""
        );

        // Check token ownership
        assertEq(pinV.balanceOf(user1, 1), 1);

        // Check Store creation
        address storeAddr = pinV.pinStores(1);
        assertTrue(storeAddr != address(0));

        PinVStore store = PinVStore(payable(storeAddr));
        assertEq(store.creator(), user1);
        assertEq(store.title(), "My First Pin");
        assertEq(store.tagline(), "The coolest pin ever");
        assertEq(store.versions(1), "QmHash123");
        assertEq(store.latestVersion(), 1);

        vm.stopPrank();
    }

    function testSecondaryMint() public {
        // 1. Initial Mint
        vm.deal(user1, 10 ether);
        vm.startPrank(user1);
        (uint256 initialMintPrice, , , ) = pinV.config();
        pinV.mint{value: initialMintPrice}(
            user1,
            "Title",
            "Tagline",
            "Hash1",
            ""
        );

        // 2. Setup Secondary Mint
        address storeAddr = pinV.pinStores(1);
        PinVStore store = PinVStore(payable(storeAddr));

        uint256 secPrice = 0.02 ether;
        store.setSecondaryMintPrice(secPrice);
        vm.stopPrank();

        // 3. User2 buys secondary mint
        vm.deal(user2, 10 ether);
        vm.startPrank(user2);

        uint256 amount = 2;
        uint256 totalCost = secPrice * amount; // 0.04 ether

        uint256 creatorBalanceBefore = user1.balance;

        pinV.secondaryMint{value: totalCost}(1, amount, "");

        // 4. Verification
        // User2 balance
        assertEq(pinV.balanceOf(user2, 1), 2);

        // Config: 5% fee (500 bps)
        Config.ConfigData memory storeConfig = store.getConfig();
        uint256 feeBps = storeConfig.secondaryMintFeeBps;
        uint256 expectedFee = (totalCost * feeBps) / 10000;
        uint256 expectedCreatorShare = totalCost - expectedFee;

        // Creator balance should NOT increase yet
        assertEq(user1.balance, creatorBalanceBefore);
        // Store balance should increase
        assertEq(address(store).balance, expectedCreatorShare);

        vm.stopPrank();

        // 5. Creator withdraws
        vm.startPrank(user1);
        store.withdraw(user1, expectedCreatorShare);
        assertEq(user1.balance, creatorBalanceBefore + expectedCreatorShare);
        vm.stopPrank();
    }

    function testStoreUpdate() public {
        // Mint first
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        (uint256 initialMintPrice, , , ) = pinV.config();
        uint256 mintPrice = initialMintPrice;
        pinV.mint{value: mintPrice}(user1, "Title", "Tagline", "Hash1", "");

        address storeAddr = pinV.pinStores(1);
        PinVStore store = PinVStore(payable(storeAddr));

        // Update Metadata
        store.updateMetadata("New Title", "New Tagline");
        assertEq(store.title(), "New Title");

        // Add Version
        store.addVersion("Hash2");
        assertEq(store.latestVersion(), 2);
        assertEq(store.versions(2), "Hash2");

        vm.stopPrank();
    }

    function testUpdateNotCreatorReverts() public {
        // Mint first
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        (uint256 initialMintPrice, , , ) = pinV.config();
        uint256 mintPrice = initialMintPrice;
        pinV.mint{value: mintPrice}(user1, "Title", "Tagline", "Hash1", "");
        vm.stopPrank();

        address storeAddr = pinV.pinStores(1);
        PinVStore store = PinVStore(payable(storeAddr));

        vm.startPrank(user2);
        vm.expectRevert(PinVStore.CallerNotCreator.selector);
        store.updateMetadata("Hacked", "Hacked");
        vm.stopPrank();
    }
}
