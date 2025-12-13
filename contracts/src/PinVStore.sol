// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Config} from "./Config.sol";

/**
 * @title PinVStore
 * @notice Stores metadata and configuration for a specific PinV token.
 * @dev Intended to be deployed as a minimal proxy (clone) for each token ID.
 */
contract PinVStore is Initializable, ReentrancyGuard, Config {
    // --- State Variables ---

    uint256 public tokenId;

    address public factory; // The parent PinV contract address
    address public creator; // The address that has rights to update this store

    string public title;
    string public tagline;

    // Versioning
    uint256 public latestVersion;
    // versionId => ipfsId (CID)
    mapping(uint256 => string) public versions;

    // Creator Custom Configuration
    uint256 public secondaryMintPrice;
    uint256 public tradingCreatorFeeBps;

    // --- Errors ---
    error CallerNotCreator();
    error EmptyIpfsId();
    error InvalidCreatorAddress();
    error InvalidBps(uint256 bps);
    error InsufficientBalance();
    error TransferFailed();

    // --- Events ---

    event StoreInitialized(
        uint256 indexed tokenId,
        address indexed creator,
        string title,
        string tagline
    );
    event MetadataUpdated(string title, string tagline);
    event VersionAdded(uint256 indexed versionId, string ipfsId);

    event CreatorUpdated(address indexed newCreator);
    event SecondaryMintPriceUpdated(uint256 price);
    event TradingCreatorFeeBpsUpdated(uint256 bps);
    event Withdrawn(address indexed to, uint256 amount);

    // --- Modifiers ---

    modifier onlyCreator() {
        if (msg.sender != creator) revert CallerNotCreator();
        _;
    }

    // --- Initialization ---

    /**
     * @notice Initializes the store. Called immediately after cloning.
     * @param _creator The address with update rights.
     * @param _tokenId The token ID this store belongs to.
     * @param _title Initial title.
     * @param _tagline Initial tagline.
     * @param _initialIpfsId Initial IPFS content ID (version 1).
     */
    function initialize(
        address _creator,
        uint256 _tokenId,
        string memory _title,
        string memory _tagline,
        string memory _initialIpfsId,
        ConfigData memory _config
    ) public initializer {
        factory = msg.sender; // The factory/main contract is the deployer of the clone (usually)
        config = _config;
        creator = _creator;
        tokenId = _tokenId;
        title = _title;
        tagline = _tagline;

        // Add initial version
        if (bytes(_initialIpfsId).length > 0) {
            latestVersion = 1;
            versions[1] = _initialIpfsId;
            emit VersionAdded(1, _initialIpfsId);
        }

        emit StoreInitialized(_tokenId, _creator, _title, _tagline);
    }

    // --- Write Functions ---

    /**
     * @notice Updates the basic metadata (title, tagline).
     */
    function updateMetadata(
        string memory _title,
        string memory _tagline
    ) external onlyCreator {
        title = _title;
        tagline = _tagline;
        emit MetadataUpdated(_title, _tagline);
    }

    /**
     * @notice Adds a new version (IPFS ID).
     */
    function addVersion(string memory _ipfsId) external onlyCreator {
        if (bytes(_ipfsId).length == 0) revert EmptyIpfsId();
        latestVersion++;
        versions[latestVersion] = _ipfsId;
        emit VersionAdded(latestVersion, _ipfsId);
    }

    /**
     * @notice Allows updating the creator address (transferring control of the store).
     */
    function setCreator(address _newCreator) external onlyCreator {
        if (_newCreator == address(0)) revert InvalidCreatorAddress();
        creator = _newCreator;
        emit CreatorUpdated(_newCreator);
    }

    /**
     * @notice Sets the price for secondary mints.
     */
    function setSecondaryMintPrice(uint256 _price) external onlyCreator {
        secondaryMintPrice = _price;
        emit SecondaryMintPriceUpdated(_price);
    }

    /**
     * @notice Sets the creator fee basis points for trading.
     */
    function setTradingCreatorFeeBps(uint256 _bps) external onlyCreator {
        if (_bps > BASIS_POINTS) revert InvalidBps(_bps);
        tradingCreatorFeeBps = _bps;
        emit TradingCreatorFeeBpsUpdated(_bps);
    }

    /**
     * @notice Allows the contract to receive ETH.
     */
    receive() external payable {}

    /**
     * @notice Withdraws ETH from the store to the creator or specified address.
     */
    function withdraw(address to, uint256 amount) external onlyCreator {
        if (address(this).balance < amount) revert InsufficientBalance();
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Withdrawn(to, amount);
    }
}
