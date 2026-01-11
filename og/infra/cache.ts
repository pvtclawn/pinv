import Redis from 'ioredis';
import {
    REDIS_URL,
    REDIS_CONNECT_TIMEOUT,
    REDIS_MAX_RETRIES,
    REDIS_RETRY_LIMIT,
    REDIS_RETRY_DELAY_BASE,
    REDIS_RETRY_DELAY_MAX
} from '../utils/constants';

// Initialize Redis
export const redis = new Redis(REDIS_URL, {
    connectTimeout: REDIS_CONNECT_TIMEOUT,
    maxRetriesPerRequest: REDIS_MAX_RETRIES,
    enableOfflineQueue: false, // Fail fast if disconnected
    retryStrategy: (times) => {
        if (times > REDIS_RETRY_LIMIT) return null; // Stop retrying after limit
        return Math.min(times * REDIS_RETRY_DELAY_BASE, REDIS_RETRY_DELAY_MAX);
    }
});

// Prevent crash on connection error
redis.on('error', (err) => {
    // Suppress connection errors to allow fallback to memory cache
    console.warn('[Redis] Connection failed, falling back to memory cache:', err.message);
});

// In-memory LRU fallback
export const memoryCache = new Map<string, { data: Buffer, expires: number }>();
