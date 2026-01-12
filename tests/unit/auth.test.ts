import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveContext } from '../../og/services/auth';
import * as SigUtils from '../../og/utils/sig';
import * as BundleUtils from '../../og/utils/bundle';
import * as PinInfra from '../../og/infra/pin';

describe('Auth Service', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should authorize valid signed bundles', async () => {
        const mockBundle = { ver: '1', ts: 12345, params: {} };

        // Mock Utils
        vi.spyOn(BundleUtils, 'parseBundle').mockReturnValue(mockBundle);
        vi.spyOn(SigUtils, 'verifySignature').mockResolvedValue('0x123User');

        const ctx = await resolveContext(1, { b: 'base64bundle', sig: 'validSig' });

        expect(ctx.authorizedBundle).toEqual(mockBundle);
        expect(ctx.cacheVer).toBe('1');
    });

    it('should reject invalid signatures (but allow legacy unsigned flow if policy permits)', async () => {
        const mockBundle = { ver: '1' };

        vi.spyOn(BundleUtils, 'parseBundle').mockReturnValue(mockBundle);
        vi.spyOn(SigUtils, 'verifySignature').mockResolvedValue(null); // Invalid

        // Note: Current logic logs failure but doesn't throw (legacy compat). 
        // But authorizedBundle should NOT be set if we want strict mode?
        // Actually, looking at auth.ts:
        // if (signer) { authorized = true } 
        // else { console.log('FAILED') } -> authorized remains false.

        const ctx = await resolveContext(1, { b: 'base64bundle', sig: 'badSig' });

        expect(ctx.authorizedBundle).toBeNull();
    });

    it('should resolve standard Pin version when no bundle provided', async () => {
        const mockPin = {
            id: 1,
            version: '5',
            title: 'Test',
            tagline: '',
            lastUpdated: 0,
            cid: 'Qm...',
            creator: '0x00',
            data: '0x00'
        };
        vi.spyOn(PinInfra, 'getPin').mockResolvedValue(mockPin as any); // Use as any to be safe or full mock


        const ctx = await resolveContext(1, {});

        expect(ctx.preFetchedPin).toEqual(mockPin);
        expect(ctx.cacheVer).toBe('5');
    });
});
