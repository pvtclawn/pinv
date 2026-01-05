import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root if not already loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const LIT_CONFIG = {
    NETWORK: process.env.LIT_NETWORK || 'datil-dev',
    DEBUG: process.env.LIT_DEBUG === 'true',
    // PinV specific constants
    CHAIN_ID: parseInt(process.env.PINV_CHAIN_ID || '84532'), // Base Sepolia
    ERC1155_ADDRESS: process.env.PINV_ERC1155_ADDRESS || '',
    IPFS_GATEWAY: process.env.PINV_IPFS_GATEWAY_BASE || 'https://gateway.pinata.cloud/ipfs/',
    TS_MAX_AGE_SEC: parseInt(process.env.PINV_TS_MAX_AGE_SEC || '86400'),
    TS_FUTURE_SKEW_SEC: parseInt(process.env.PINV_TS_FUTURE_SKEW_SEC || '600'),
};

if (!LIT_CONFIG.ERC1155_ADDRESS) {
    console.warn("Warning: PINV_ERC1155_ADDRESS is not set in env");
}
