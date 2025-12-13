// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Config {
    uint256 public constant BASIS_POINTS = 100_00;

    struct ConfigData {
        uint256 initialMintPrice;
        uint256 minSecondaryMintPrice;
        uint256 secondaryMintFeeBps;
        uint256 tradingFeeBps;
    }

    // Config struct holding all global variables
    ConfigData public config;

    function getConfig() external view returns (ConfigData memory) {
        return config;
    }
}
