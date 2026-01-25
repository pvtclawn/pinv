# PinV OG Engine

> High-performance Open Graph image generation service for PinV Frames.

## Overview

**PinV OG** is the rendering powerhouse of the network. It is responsible for:
1.  **Executing** the dynamic logic of a Pin (via `pinv-box` or local sandbox).
2.  **Rendering** the resulting UI (React components) into static images (PNG).
3.  **Caching** results to ensure fast Frame responses (sub-2s required by Farcaster).

It uses **Fastify** for high throughput, **Satori** for converting React/HTML to SVG, and **Resvg** for high-quality rasterization.

## Architecture

-   **Server**: Fastify (Node.js)
-   **Rendering**: Satori (HTML → SVG) + Resvg (SVG → PNG)
-   **Caching**: Redis (Optional/Configurable)

## API Reference

### 1. Render Pin Image
Returns a generated PNG image for a specific Pin.

-   **GET** `/og/:pinId`
-   **Query Parms**:
    -   `t`: Timestamp (cache busting)
    -   `params`: encoded parameters for the widget
    -   `ver`: version hash
-   **Response**: `image/png`

### 2. Preview (Development)
Used by the frontend editor to preview widgets in real-time.

-   **POST** `/og/preview`
-   **Body**:
    ```json
    {
      "code": "...", // The widget logic
      "params": { ... }
    }
    ```
-   **Response**: `image/png`

### 3. Health Check
-   **GET** `/healthz`

## Development

### Prerequisites
-   Bun
-   Access to IPFS Gateway (configured in `.env`)

### Run Locally

```bash
bun run dev
# Listens on port 3001 (default)
```

### Environment Variables

Inherits from root `.env`:
-   `NEXT_PUBLIC_IPFS_GATEWAY`: For fetching image assets.
-   `KV_REST_API_URL`: For caching (Vercel KV / Redis).
-   `INTERNAL_AUTH_KEY`: Integration with Box.
