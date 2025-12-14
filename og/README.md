# OG Engine Service

A dedicated, sandboxed service for rendering PinV widget thumbnails.

## Features
- **Security**: Runs untrusted widget code in a sandboxed child process (no network, restricted globals).
- **Performance**: Two-tier caching (L1 Memory, L2 Redis) + Request Locking.
- **Access Control**: EIP-712 Signature Verification for customized OGs.

## Development

1. **Install Dependencies**
   ```bash
   cd og
   npm install
   ```

2. **Run Locally**
   ```bash
   # Requires root .env for RPC configuration
   npm run dev
   ```
   Server runs on `http://localhost:8080`.

3. **Verify**
   ```bash
   # Check health
   curl http://localhost:8080/health

   # Render specific pin
   curl -v "http://localhost:8080/og/123.png" > output.png
   ```

## Deployment

The service is configured for Fly.io.

```bash
fly launch # first time
fly deploy
```

## Structure
- `server.ts`: Main Fastify server, handles caching and auth.
- `worker.js`: Rendering worker, reads JSON from stdin, writes PNG to stdout.
- `lib/security.ts`: Signature verification logic.
