#!/bin/bash
set -e

# Load .env from parent directory if it exists
if [ -f ../.env ]; then
    source ../.env
fi

NETWORK=${1:-sepolia} # Default to sepolia
echo "Selected Network: $NETWORK"

# Default Base RPCs
DEFAULT_RPC_SEPOLIA="https://sepolia.base.org"
DEFAULT_RPC_MAINNET="https://mainnet.base.org"

# Select variables based on network
if [ "$NETWORK" == "mainnet" ]; then
    TARGET_RPC_URL="${RPC_URL_BASE:-$DEFAULT_RPC_MAINNET}"
    PINV_ADDR_KEY="NEXT_PUBLIC_PINV_ADDRESS_BASE"
    STORE_IMPL_KEY="NEXT_PUBLIC_PINV_STORE_IMPL_BASE"
elif [ "$NETWORK" == "sepolia" ]; then
    TARGET_RPC_URL="${RPC_URL_BASE_SEPOLIA:-$DEFAULT_RPC_SEPOLIA}"
    PINV_ADDR_KEY="NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA"
    STORE_IMPL_KEY="NEXT_PUBLIC_PINV_STORE_IMPL_BASE_SEPOLIA"
else
    echo "Error: Unknown network '$NETWORK'. Use 'sepolia' or 'mainnet'."
    exit 1
fi

# API Key (Common)
if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo "Warning: ETHERSCAN_API_KEY not set. Verification will fail."
fi

# Run deployment
echo "Deploying to $NETWORK..."
echo "Using RPC: $TARGET_RPC_URL"
echo "Please unlock your 'default' keystore account:"

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$TARGET_RPC_URL" \
    --account default \
    --broadcast \
    --verify \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    -vvvv

# Get Chain ID for path resolution
CHAIN_ID=$(cast chain-id --rpc-url "$TARGET_RPC_URL")
RUN_FILE="broadcast/Deploy.s.sol/$CHAIN_ID/run-latest.json"

if [ ! -f "$RUN_FILE" ]; then
    echo "Error: Run file not found at $RUN_FILE"
    exit 1
fi

# Extract addresses using jq
PINV_STORE_IMPL=$(jq -r '.transactions[] | select(.contractName == "PinVStore") | .contractAddress' "$RUN_FILE" | tail -n 1)
PINV_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "PinV") | .contractAddress' "$RUN_FILE" | tail -n 1)

echo "------------------------------------------------"
echo "Deployment Complete ($NETWORK)"
echo "PinVStore Impl: $PINV_STORE_IMPL"
echo "PinV Address:   $PINV_ADDRESS"
echo "------------------------------------------------"

# Update .env
ENV_FILE="../.env"

update_env() {
    local key=$1
    local val=$2
    
    if [ -z "$val" ] || [ "$val" == "null" ]; then
        echo "Warning: Value for $key is empty contract deployment might have failed."
        return
    fi

    if grep -q "^$key=" "$ENV_FILE"; then
        sed -i "s|^$key=.*|$key=$val|" "$ENV_FILE"
    else
        echo "$key=$val" >> "$ENV_FILE"
    fi
}

echo "Updating $ENV_FILE..."
update_env "$PINV_ADDR_KEY" "$PINV_ADDRESS"
update_env "$STORE_IMPL_KEY" "$PINV_STORE_IMPL"

# Also update generic/current pointers for easy dev access (optional, but helpful)
update_env "NEXT_PUBLIC_PINV_ADDRESS" "$PINV_ADDRESS"
update_env "NEXT_PUBLIC_PINV_STORE_IMPL" "$PINV_STORE_IMPL"

echo "Done."
