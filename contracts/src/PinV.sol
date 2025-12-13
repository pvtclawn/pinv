// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {
    ERC1155Supply
} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {PinVStore} from "./PinVStore.sol";
import {ConfigOwnable} from "./ConfigOwnable.sol";

/**
 * @title PinV
 * @notice Application entry point for PinV tokens. Handles minting and deploying storage clones.
 */
contract PinV is ERC1155Supply, ReentrancyGuard, ConfigOwnable {
    // --- State Variables ---

    uint256 public nextTokenId;

    // Template for PinVStore clones
    address public pinStoreImplementation;

    // tokenId => PinVStore contract address
    mapping(uint256 => address) public pinStores;

    // --- Errors ---
    error InsufficientPayment(uint256 required, uint256 sent);
    error InvalidImplementation();
    error NoBalanceToWithdraw();
    error WithdrawalFailed();
    error StoreNotFound(uint256 tokenId);
    error TransferFailed();

    // --- Events ---

    event Mint(
        uint256 indexed tokenId,
        address indexed creator,
        address storeAddress,
        string title
    );
    event SecondaryMint(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount,
        uint256 totalPrice,
        uint256 fee
    );

    event Withdrawn(address indexed to, uint256 amount);

    // --- Constructor ---

    constructor(
        address _pinStoreImplementation,
        ConfigData memory _config
    ) ERC1155("") ConfigOwnable(msg.sender) {
        pinStoreImplementation = _pinStoreImplementation;
        config = _config;
        nextTokenId = 1;
    }

    // --- Minting ---

    /**
     * @notice Mints a new PinV token and deploys its storage.
     * @param to Recipient of the token (creator).
     * @param title Title of the Pin.
     * @param tagline Tagline of the Pin.
     * @param initialIpfsId Initial IPFS content CID.
     * @param data Additional data for ERC1155 receiver hook.
     */
    function mint(
        address to,
        string memory title,
        string memory tagline,
        string memory initialIpfsId,
        bytes memory data
    ) external payable nonReentrant {
        if (msg.value < config.initialMintPrice) {
            revert InsufficientPayment(config.initialMintPrice, msg.value);
        }

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        // Deploy Store Clone
        address store = Clones.clone(pinStoreImplementation);
        PinVStore(payable(store)).initialize(
            to,
            tokenId,
            title,
            tagline,
            initialIpfsId,
            config
        );

        pinStores[tokenId] = store;

        _mint(to, tokenId, 1, data);
        emit Mint(tokenId, to, store, title);
    }

    /**
     * @notice Mints additional tokens for an existing Pin.
     * @param tokenId The token ID to mint.
     * @param amount The amount to mint.
     * @param data Additional data.
     */
    function secondaryMint(
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) external payable nonReentrant {
        address storeAddr = pinStores[tokenId];
        if (storeAddr == address(0)) revert StoreNotFound(tokenId);

        PinVStore store = PinVStore(payable(storeAddr));
        ConfigData memory storeConfig = store.getConfig();

        uint256 price = store.secondaryMintPrice();
        uint256 totalPrice = price * amount;

        if (msg.value < totalPrice) {
            revert InsufficientPayment(totalPrice, msg.value);
        }

        uint256 fee = (msg.value * storeConfig.secondaryMintFeeBps) / BASIS_POINTS;
        uint256 creatorShare = msg.value - fee;

        (bool success, ) = payable(address(store)).call{value: creatorShare}("");

        if (!success) revert TransferFailed();

        _mint(msg.sender, tokenId, amount, data);
        emit SecondaryMint(tokenId, msg.sender, amount, totalPrice, fee);
    }

    // --- Admin / Configuration ---

    function setPinStoreImplementation(address _newImpl) external onlyOwner {
        if (_newImpl == address(0)) revert InvalidImplementation();
        pinStoreImplementation = _newImpl;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalanceToWithdraw();
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
        emit Withdrawn(owner(), balance);
    }

    // --- Overrides ---

    // The following functions are overrides required by Solidity.

    function uri(
        uint256 _tokenId
    ) public view override returns (string memory) {
        // We could delegate this to the store if it holds the metadata URI
        // For now, return default or empty, or fetch from store?
        // User didn't specify URI logic, but usually we prefer a standard JSON.
        // We'll leave it simple for now, maybe return the IPFS of the latest version from the store?
        // Accessing the store:
        address store = pinStores[_tokenId];
        if (store != address(0)) {
            // Ideally we'd return a metadata JSON.
            // Let's just standard ERC1155 uri if set, or empty.
            return super.uri(_tokenId);
        }
        return super.uri(_tokenId);
    }
}
