import { createHash } from 'crypto';

/**
 * Utility to extract metadata from a PNG buffer.
 */
export function extractPngMetadata(buffer: Buffer, key: string): string | null {
    let offset = 8;
    
    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString();
        
        if (type === 'tEXt') {
            const data = buffer.subarray(offset + 8, offset + 8 + length);
            const nullIndex = data.indexOf(0);
            const keyword = data.subarray(0, nullIndex).toString('ascii');
            
            if (keyword === key) {
                return data.subarray(nullIndex + 1).toString('utf8');
            }
        }
        
        offset += 12 + length;
        if (type === 'IEND') break;
    }
    
    return null;
}
