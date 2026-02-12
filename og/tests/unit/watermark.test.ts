import { describe, it, expect } from 'vitest';
import { injectPngMetadata, generateExecutionHash } from '../../infra/watermark';

describe('Watermark Utils', () => {
    it('should inject metadata into a dummy PNG buffer', () => {
        // ... (existing test code)
    });

    describe('generateExecutionHash', () => {
        const cid = 'test-cid';
        const uiCode = 'export default () => <div>Hello</div>';
        const props = { a: 1, b: 2 };
        const timestamp = 123456789;
        const secret = 'secret';

        it('should be deterministic regardless of props key order', () => {
            const hash1 = generateExecutionHash(cid, uiCode, props, timestamp, secret);
            const hash2 = generateExecutionHash(cid, uiCode, { b: 2, a: 1 }, timestamp, secret);
            expect(hash1).toBe(hash2);
        });

        it('should change if props change', () => {
            const hash1 = generateExecutionHash(cid, uiCode, props, timestamp, secret);
            const hash2 = generateExecutionHash(cid, uiCode, { ...props, c: 3 }, timestamp, secret);
            expect(hash1).not.toBe(hash2);
        });

        it('should change if uiCode changes', () => {
            const hash1 = generateExecutionHash(cid, uiCode, props, timestamp, secret);
            const hash2 = generateExecutionHash(cid, 'different code', props, timestamp, secret);
            expect(hash1).not.toBe(hash2);
        });
    });
});
