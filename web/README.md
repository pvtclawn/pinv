# PinV Web

> The frontend interface and Farcaster MiniApp for PinV.

## Overview

**PinV Web** is a Next.js 15 application that serves two primary purposes:
1.  **Web App**: A desktop/mobile web interface for creating, editing, and trading Pins.
2.  **Farcaster/Base MiniApp**: A highly optimized, embedded experience for users interacting via Farcaster clients (Warpcast).

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Styling**: Tailwind CSS + Shadcn UI
-   **Web3**: Wagmi + Viem + OnchainKit
-   **State**: TanStack Query
-   **Encryption**: ECIES (Client-side encryption for Box communication)

## Core Features

-   **Pin Editor**: AI-assisted editor for generating widget logic.
-   **Marketplace**: Discovery and trading of Pins (ERC1155).
-   **Frame Handling**: Responds to Frame actions (POST) and renders MiniApp views.
-   **Secure Ops**: Handles client-side encryption of secrets before sending storing them onchain for later retrieval in `box` or `og` services.

## Development

### Prerequisites
-   Bun
-   `.env.local` configured (see root `.env.example`).

### Run Locally

```bash
bun dev
# -> http://localhost:3000
```

### Key Routes
-   `/`: Landing page & Marketplace.
-   `/create`: Pin Creator/Editor.
-   `/api/*`: Farcaster MiniApp interaction endpoints.
-   `/.well-known/farcaster.json`: Frame Manifest.

## Deployment

Deploys natively to **Vercel**.
Ensure the Build Command in `vercel.json` is respected (handles monorepo build context).
