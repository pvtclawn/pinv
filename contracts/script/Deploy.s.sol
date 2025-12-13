// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PinV} from "../src/PinV.sol";
import {PinVStore} from "../src/PinVStore.sol";
import {Config} from "../src/Config.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        PinVStore storeImpl = new PinVStore();

        // Initial Config
        // Initial Config
        Config.ConfigData memory config = Config.ConfigData({
            initialMintPrice: 0.001 ether,
            minSecondaryMintPrice: 0.0005 ether,
            secondaryMintFeeBps: 500, // 5%
            tradingFeeBps: 250 // 2.5%
        });
        PinV pinV = new PinV(address(storeImpl), config);

        console.log("PinVStore Implementation:", address(storeImpl));
        console.log("PinV Deployed:", address(pinV));

        vm.stopBroadcast();
    }
}
