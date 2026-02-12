import { createHash } from 'crypto';

/**
 * Utility to inject metadata into a PNG buffer using tEXt chunks.
 * PNG Structure: [Signature] [Chunk 1] [Chunk 2] ...
 * Chunk Structure: [Length: 4] [Type: 4] [Data: L] [CRC: 4]
 */
export function injectPngMetadata(buffer: Buffer, key: string, value: string): Buffer {
    // PNG Signature is 8 bytes
    const signature = buffer.subarray(0, 8);
    let offset = 8;
    
    const chunks: Buffer[] = [signature];
    
    // Find where to insert (before IEND)
    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString();
        
        if (type === 'IEND') {
            // Insert our chunk here
            const chunkData = Buffer.concat([
                Buffer.from(key, 'ascii'),
                Buffer.from([0]), // Null separator
                Buffer.from(value, 'utf8')
            ]);
            
            const chunk = Buffer.alloc(4 + 4 + chunkData.length + 4);
            chunk.writeUInt32BE(chunkData.length, 0);
            chunk.write('tEXt', 4);
            chunkData.copy(chunk, 8);
            
            // CRC (Type + Data)
            const crcInput = chunk.subarray(4, 4 + 4 + chunkData.length);
            const crc = calculateCrc32(crcInput);
            chunk.writeUInt32BE(crc, 8 + chunkData.length);
            
            chunks.push(chunk);
        }
        
        const fullChunk = buffer.subarray(offset, offset + 12 + length);
        chunks.push(fullChunk);
        
        if (type === 'IEND') break;
        offset += 12 + length;
    }
    
    return Buffer.concat(chunks);
}

/**
 * Standard CRC-32 for PNG chunks.
 */
function calculateCrc32(buf: Buffer): number {
    let crc = 0xFFFFFFFF;
    const table = getCrcTable();
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crcTable: number[] | null = null;
function getCrcTable() {
    if (crcTable) return crcTable;
    crcTable = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
            else c = c >>> 1;
        }
        crcTable[i] = c >>> 0;
    }
    return crcTable;
}

/**
 * Generates a verification hash for the image.
 */
export function generateExecutionHash(cid: string, timestamp: number, secret: string): string {
    return createHash('sha256')
        .update(`${cid}:${timestamp}:${secret}`)
        .digest('hex');
}
