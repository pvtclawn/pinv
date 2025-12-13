// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Config} from "./Config.sol";

contract ConfigOwnable is Config, Ownable {
    event ConfigUpdated(ConfigData newConfig);

    constructor(address initialOwner) Ownable(initialOwner) {}

    error InvalidBps();

    function setConfig(ConfigData memory _config) external onlyOwner {
        if (
            _config.secondaryMintFeeBps > BASIS_POINTS ||
            _config.tradingFeeBps > BASIS_POINTS
        ) {
            revert InvalidBps();
        }
        config = _config;
        emit ConfigUpdated(_config);
    }
}
