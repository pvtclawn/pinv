# PinV [WIP]

PinV is a decentralized Farcaster mini-app that turns dynamic, AI-generated widgets into tradable, ownable assets (ERC1155 tokens). It allows users to "pin" live, interactive content to their Farcaster profile or channel, powered by secure, decentralized execution.

## 🌟 Vision & Mechanics

### 📌 The "Pin" Protocol
- **ERC1155 Tokens**: Each Pin is an ERC1155 token. Ownership grants the right to configure and display the widget.
- **Dynamic Content**: Unlike static NFTs, Pins display real-time data (weather, prices, commit history) rendered on-demand.
- **Cast & Preview**: Pins are designed to be "casted" into the feed or "pinned" to a user's Farcaster profile/channel, providing a live window into dynamic content.

### 🧠 Decentralized Logic (Lit Protocol)
- **Lit Actions**: The "brain" of each Pin. This is the javascript code responsible for fetching data and logic.
- **Owner-Only Updates**: The Lit Action logic is bound to the token. Only the current token owner can authorize changes to the widget's configuration or parameters via Lit Protocol.
- **Secret Management**: API keys and secrets are encrypted and attached to the token, accessible only by the Lit Action during execution.

### 📦 Storage & Versioning
- **IPFS Storage**: The widget's source code (Lit Action + React UI) is encoded and stored on IPFS.
- **Metadata Link**: The IPFS hash (CID) is stored in the token's metadata, ensuring immutability and version history for both the logic and the System Prompt used to generate it.

### 💸 Economy & Incentives
- **Minting & Cloning**: Anyone can "mint" a copy of a popular Pin to use on their own profile (with their own parameters, e.g., their own City or FID).
- **Fee Sharing**:
  - **Platform Fees**: Sustainable revenue for the protocol.
  - **Creator Royalties**: The original creator (minter) of a Pin receives a share of fees from subsequent mints and trading volume, incentivizing high-quality, useful widgets.

## 🛠️ Current Status: Work In Progress

This project is currently in active development.

- ✅ **AI Generation**: Robust generation of Lit Actions and React UI using LLM API.
- ✅ **Live Preview**: Client-side sandboxed execution for testing.
- ✅ **Satori Rendering**: Server-side generation of beautiful, accurate preview images.
- 🚧 **Smart Contracts**: ERC1155 integration and Fee Sharing logic (In Design).
- 🚧 **IPFS Integration**: Storage adapter for code and metadata (In Progress).
- 🚧 **Lit Protocol**: Full decentralized execution environment (In Progress).

## 🚀 Getting Started (Dev)

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/guy-do-or-die/pinv.app.git
    npm install
    ```
2.  **Env Setup**: Copy `.env.example` to `.env.local` and add `AI_API_KEY` (or provider specific key).
3.  **Run**: `npm run dev` to see the widget generation and preview flow.
