# PinV Box

> The Secure Privacy Layer & Trust Root for the PinV Network.

## Overview

**PinV Box** is an internal microservice designed to run inside a **Trusted Execution Environment (TEE)**. It is the "Private Brain" of the PinV architecture. It handles key management and private data fetching.

PinV Box is designed with a "Zero-Trust" architecture: not even the operator should be able to see the keys or data processing occurring inside the enclave.

## Key Features

1.  **Secure Sandbox Isolation**:
    *   Uses `isolated-vm` to execute untrusted JavaScript code in a secure, memory-limited, and time-boxed environment.
    *   Protecting the host system from potential malicious scripts.

2.  **Trusted Execution Enclave**:
    *   Built to run on **Phala Network** (or compatible TEE providers).
    *   Utilizes Remote Attestation (via `@phala/dstack-sdk`) to prove the integrity of the code driving the box.

3.  **Encrypted Communication**:
    *   **Hybrid Encryption (ECIES + AES-GCM)**: A secure **AES-256-GCM** session key is generated on the client to encrypt the payload (data/code).
    *   **Key Encapsulation**: The session key itself is then encrypted using the Box's public key (**ECIES**) and attached to the request.
    *   **Zero-Knowledge**: The decryption private key resides only within the TEE's enclave memory.

4.  **Hardware-Level Privacy**:
    *   Data is decrypted only within the CPU's encrypted memory enclave.
    *   External API calls (Fetch) are proxied through a controlled layer.

## Architecture

```mermaid
graph TD
    User[User / Client] -->|Encrypted Params| Box[PinV Box Service (TEE)]
    Box -->|Decrypt| BoxInternal[Secure Memory]
    BoxInternal -->|Execute| Sandbox[isolated-vm Sandbox]
    Sandbox -->|Fetch Data| ExternalAPIs[External APIs (OpenAI, etc)]
    Sandbox -->|Return JSON| Box
    Box -->|JSON Result| User
```

## API Reference

The service exposes a REST API (powered by Hono).

**Base URL**: `http://localhost:5555` (default)

### 1. Health Checks
-   **GET /healthz**: Returns "ok". Checks if the process is up.
-   **GET /readyz**: Returns "ready" (200) or error (503). Checks if TEE keys are generated and Isolate Pool is warm.

### 2. Metrics & Observability
-   **GET /metrics**
-   **Headers**: `Authorization`: `Bearer <INTERNAL_AUTH_KEY>`
-   **Response**: Prometheus-formatted metrics (pool status, execution times, etc).

### 3. Public Key
Get the TEE's public encryption key to encrypt your secrets before sending them.
-   **GET /public-key**
-   **Response**:
    ```json
    {
      "ok": true,
      "publicKey": "04a6b..." // Hex string of the secp256k1 public key
    }
    ```

### 4. Execute Script
Run a script securely inside the sandbox.
-   **POST /execute**
-   **Headers**:
    -   `Authorization`: `Bearer <INTERNAL_AUTH_KEY>`
    -   `Content-Type`: `application/json`
-   **Body** (JSON):
    ```json
    {
      "code": "/* optional plain script */",
      "params": { "myParam": "value" },
      "encryptedCode": "/* optional ECIES encrypted script */",
      "encryptedParams": "/* ECIES encrypted JSON envelope containing secure params */",
      "publicParams": { "visible": "true" }
    }
    ```
    *Note: `encryptedParams` are decrypted inside the enclave and merged with `params`.*

-   **Response**:
    ```json
    {
      "ok": true,
      "result": { "myOutput": 123 }, // The return value of the script
      "meta": {
        "logs": [], // Console logs from the script
        "durationMs": 15
      }
    }
    ```

## Local Development

### Prerequisites
-   Node.js v20+ or v24 (LTS recommended)
-   Bun (for package management)
-   Docker (for simulation)

### Setup
1.  **Install Dependencies**:
    ```bash
    bun install
    ```

2.  **Run Locally (Mock Mode)**:
    Runs the service directly on your host machine. *Note: true TEE security features are simulated.*
    ```bash
    bun run dev
    # Runs: node --no-node-snapshot --import tsx src/index.ts
    ```

### Environment Variables

The service is configured exclusively via environment variables.

> **Source of Truth**: See [`src/config.ts`](./src/config.ts) for the complete list of available variables and their default values.

Key variables include `PORT`, `INTERNAL_AUTH_KEY` (Required), and `POOL_SIZE`.

## Docker & Deployment

### Build & Run Container
```bash
# Build
npm run docker:build

# Run (Local)
npm run docker:run
# Maps port 5555 to host
```

### Production Deployment
The `Dockerfile` is optimized for deployment on Phala Network or other containerized TEE environments.
It ensures `isolated-vm` is recompiled against the exact Node.js ABI present in the container.
