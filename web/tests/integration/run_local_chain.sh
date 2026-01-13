#!/bin/bash
set -e

# Config
ANVIL_PORT=8545
ANVIL_URL="http://127.0.0.1:$ANVIL_PORT"
ANVIL_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CONTRACTS_DIR="$(dirname "$0")/../../contracts"

echo "[Harness] Starting Anvil..."
anvil --port $ANVIL_PORT > /dev/null 2>&1 &
ANVIL_PID=$!
echo "[Harness] Anvil started (PID: $ANVIL_PID). Waiting for ready..."

# Cleanup trap
cleanup() {
    echo "[Harness] Killing Anvil..."
    kill $ANVIL_PID
}
trap cleanup EXIT

sleep 3

echo "[Harness] Deploying Contracts..."
cd $CONTRACTS_DIR

# Run Deploy Script
# Note: broadcast/Deploy.s.sol/31337/run-latest.json will be generated
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $ANVIL_URL \
    --private-key $ANVIL_PK \
    --broadcast \
    --skip-simulation

# Resolve Broadcast File (Chain ID 31337)
RUN_FILE="broadcast/Deploy.s.sol/31337/run-latest.json"

if [ ! -f "$RUN_FILE" ]; then
    echo "Error: Broadcast file not found at $RUN_FILE"
    exit 1
fi

# Extract Address
PINV_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PinV") | .contractAddress' "$RUN_FILE" | tail -n 1)

echo "[Harness] Deployed PinV to: $PINV_ADDRESS"

# Run Test
cd ../
echo "[Harness] Running Integration Tests..."
export LOCAL_CONTRACT_ADDRESS=$PINV_ADDRESS
bun x vitest run tests/integration/local_flow.test.ts
