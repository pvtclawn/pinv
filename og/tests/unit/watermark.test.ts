import { describe, it, expect } from 'vitest';
import { injectPngMetadata } from '../../infra/watermark';

describe('Watermark Utils', () => {
    it('should inject metadata into a dummy PNG buffer', () => {
        // Minimum valid PNG: 8 bytes signature + IHDR + IDAT + IEND
        const dummyPng = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // Signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR
            0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F, 0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0x44, 0x74, 0x8E, // IDAT
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
        ]);
        
        const key = 'TestKey';
        const value = 'TestValue';
        
        const result = injectPngMetadata(dummyPng, key, value);
        
        expect(result.length).toBeGreaterThan(dummyPng.length);
        
        const resultStr = result.toString('binary');
        expect(resultStr).toContain(key);
        expect(resultStr).toContain(value);
        expect(resultStr).toContain('tEXt');
        
        // Ensure IEND is still at the very end
        const last8 = result.subarray(result.length - 8, result.length);
        expect(last8.subarray(0, 4).toString()).toBe('IEND');
    });
});
