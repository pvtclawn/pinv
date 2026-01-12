import path from 'path';
import * as dotenv from 'dotenv';
import { pinVAddress } from './contracts';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local'), override: true });

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const REDIS_CONNECT_TIMEOUT = 2000;
export const REDIS_MAX_RETRIES = 1; // Fail fast
export const REDIS_RETRY_LIMIT = 3;
export const REDIS_RETRY_DELAY_BASE = 50;
export const REDIS_RETRY_DELAY_MAX = 2000;

export const CACHE_TTL = 604800; // 7 days (Long-term storage)
export const IPFS_CACHE_TTL = 3600 * 24; // 24 hours
export const PRIORITY_GATEWAY = process.env.PRIORITY_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY;
export const PUBLIC_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
];

export const REVALIDATE_TTL = 60; // 1 minute (Freshness check for dynamic content)
export const LOCK_TTL = 30; // 30s lock for generation

export const PORT = parseInt(process.env.PORT || '8080');
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532') as 8453 | 84532 | 31337;

export const CONTRACT_ADDRESS = pinVAddress[CHAIN_ID] || pinVAddress[84532];
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 800;
export const WORKER_TIMEOUT_MS = 10000;
export const MEMORY_CACHE_TTL = 300000; // 5 minutes (Fallback)
export const MEMORY_CACHE_MAX_ITEMS = 500; // ~50MB limit

