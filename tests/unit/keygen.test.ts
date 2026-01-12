import { describe, it, expect } from 'vitest';
import { generateCacheKey } from '../../og/utils/keygen';
import { OgContext } from '../../og/services/auth';

describe('Key Generation Utils', () => {
    const mockCtx: OgContext = {
        authorizedBundle: null,
        cacheVer: '1',
        cacheTs: '1234567890',
        cacheParamsHash: 'hash123',
        preFetchedPin: null
    };

    it('should generate deterministic keys', () => {
        const result1 = generateCacheKey(1, mockCtx, { color: 'red' });
        const result2 = generateCacheKey(1, mockCtx, { color: 'red' });

        expect(result1.cacheKey).toBe(result2.cacheKey);
        expect(result1.lockKey).toBe(result2.lockKey);
    });

    it('should exclude "t" parameter from cache key (Freshness Check)', () => {
        const result1 = generateCacheKey(1, mockCtx, { color: 'red' });
        const result2 = generateCacheKey(1, mockCtx, { color: 'red', t: '999999' });

        expect(result1.cacheKey).toBe(result2.cacheKey);
    });

    it('should include other query params in the key', () => {
        const result1 = generateCacheKey(1, mockCtx, { color: 'red' });
        const result2 = generateCacheKey(1, mockCtx, { color: 'blue' });

        expect(result1.cacheKey).not.toBe(result2.cacheKey);
    });

    it('should include context version in the key', () => {
        const ctx2 = { ...mockCtx, cacheVer: '2' };

        const result1 = generateCacheKey(1, mockCtx, { color: 'red' });
        const result2 = generateCacheKey(1, ctx2, { color: 'red' });

        expect(result1.cacheKey).not.toBe(result2.cacheKey);
    });
});
