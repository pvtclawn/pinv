#!/bin/bash
set -e

# Configuration
ANVIL_PORT=8545
IPFS_PORT=8081
API_PORT=3001
ANVIL_URL="http://127.0.0.1:$ANVIL_PORT"
ANVIL_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PROJECT_ROOT=$(cd "$(dirname "$0")/../../" && pwd)

# PIDs for cleanup
PIDS=()

cleanup() {
    echo ""
    echo "[Harness] Shutting down services..."
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid
        fi
    done
    echo "[Harness] Cleanup complete."
}
trap cleanup EXIT

echo "=================================================="
echo "   🚀 STARTING FULL STACK LOCAL TEST ENVIRONMENT  "
echo "=================================================="

# 1. Start Anvil
echo "[1/5] Starting Anvil (Chain)..."
anvil --port $ANVIL_PORT > /dev/null 2>&1 &
PIDS+=($!)
sleep 2

# 2. Deploy Contracts
echo "[2/5] Deploying Contracts..."
cd "$PROJECT_ROOT/contracts"
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $ANVIL_URL \
    --private-key $ANVIL_PK \
    --broadcast \
    --skip-simulation > /dev/null 2>&1

# Resolve Address
RUN_FILE="broadcast/Deploy.s.sol/31337/run-latest.json"
PINV_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PinV") | .contractAddress' "$RUN_FILE" | tail -n 1)
echo "      -> Deployed PinV to: $PINV_ADDRESS"

# 3. Start Mock IPFS
echo "[3/5] Starting Mock IPFS (Data)..."
cd "$PROJECT_ROOT/tests/integration/mock_ipfs"
# python3 -m http.server $IPFS_PORT > /dev/null 2>&1 &
PORT=$IPFS_PORT bun serve_mock.ts > ../../../mock_ipfs.log 2>&1 &
PIDS+=($!)

echo "      -> Waiting for Mock IPFS..."
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$IPFS_PORT/QmLocalHash | grep -q "200"; then
        echo "      -> IPFS Ready at http://127.0.0.1:$IPFS_PORT"
        break
    fi
    sleep 1
done

# 4. Start OG Engine
echo "[4/5] Starting OG Engine (Backend)..."
cd "$PROJECT_ROOT/og"

# Environment for OG Engine
export PORT=$API_PORT
export NEXT_PUBLIC_CHAIN_ID=31337
export CONTRACT_ADDRESS=$PINV_ADDRESS
export RPC_URL=$ANVIL_URL
export PRIORITY_GATEWAY="http://127.0.0.1:$IPFS_PORT/"
export NEXT_PUBLIC_IPFS_GATEWAY="http://127.0.0.1:$IPFS_PORT/"
export REDIS_URL="" # Force Memory Mode
export LIT_NETWORK="datil-dev"
export LIT_DEBUG="true"

bun api/server.ts > ../og_engine.log 2>&1 &
PIDS+=($!)

# Wait for Engine Health
echo "      -> Waiting for Engine to be ready..."
sleep 5
# Optional: could curl /health here

# 5. Run Playwright
echo "[5/5] Running E2E Tests..."
cd "$PROJECT_ROOT"
export BASE_URL="http://localhost:$API_PORT"
export LOCAL_CONTRACT_ADDRESS=$PINV_ADDRESS

bun x playwright test tests/e2e

echo "[+] Running Integration Tests (Vitest)..."
bun test tests/integration/local_flow.test.ts
