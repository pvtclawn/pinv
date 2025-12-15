import fastify from 'fastify';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { getPin } from './lib/pin';


// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Environment & Config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = 60; // 1 minute
const LOCK_TTL = 10;
const PORT = parseInt(process.env.PORT || '8080');

// Initialize Redis with timeout to avoid hanging dev
const redis = new Redis(REDIS_URL, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 50, 2000);
    }
});

// In-memory LRU fallback
const memoryCache = new Map<string, { data: Buffer, expires: number }>();

import { parseBundle } from './lib/bundle';
import { verifySignature } from './lib/sig';
import { checkOwnership } from './lib/chain';
import { getManifest } from './lib/manifest';
import { computeParamsHash } from './lib/params';

const server = fastify({
    logger: true,
    disableRequestLogging: false // Enable logging for debugging
});

// Helper: Stub Image
function getStubImage(text: string): Buffer {
    try {
        // Production vs Dev path handling.
        // In Docker (prod), assume /app/public/hero.png
        // In Dev (local), assume ../public/hero.png
        const prodPath = '/app/public/hero.png';
        const devPath = path.join(__dirname, '../public/hero.png');

        const imagePath = fs.existsSync(prodPath) ? prodPath : devPath;

        if (fs.existsSync(imagePath)) return fs.readFileSync(imagePath);
    } catch (e) { }
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
}

// Route
server.get<{ Params: { pinId: string }, Querystring: { b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string } }>('/og/:pinId', async (request, reply) => {
    const pinId = parseInt(request.params.pinId);
    if (isNaN(pinId)) {
        return reply.code(400).send('Invalid Pin ID');
    }

    const { b, sig } = request.query;

    let authorizedBundle: any = null;
    let cacheParamsHash = '';
    let cacheVer = 'latest';
    let cacheTs = '';

    // 1. Parse & Verify Bundle (if present)
    // Only attempt if both b and sig are present (Compact Format)
    if (b && sig) {
        const bundle = parseBundle(b);
        if (bundle) {
            // Verify Signature
            const signer = await verifySignature(pinId, bundle, sig);
            if (signer) {
                // Verify Ownership
                const isOwner = await checkOwnership(signer, pinId);
                if (isOwner) {
                    authorizedBundle = bundle;
                    cacheVer = bundle.ver || 'latest';
                    cacheTs = bundle.ts ? String(bundle.ts) : '';
                    if (bundle.params) {
                        cacheParamsHash = computeParamsHash(bundle.params);
                    }
                } else {
                    server.log.warn(`Signer ${signer} does not own pin ${pinId}`);
                }
            } else {
                server.log.warn(`Invalid signature for pin ${pinId}`);
            }
        }
    } else {
        // Legacy/Direct Query Params support (optional, if we want to support ver/params without bundle?)
        // Requirement says: "If verify signed public params... If verification fails -> return stub... or default non-custom image"
        // Also: "Backward compatibility... keep it for now, but canonicalize internally"
        // For strict security per "Updated Model", we ONLY accept signed custom params.
        // Unsigned params are ignored (Tier A).

        // We do typically ignore params if not signed.
    }

    // 2. Compute Cache Key
    // cacheKey = sha256("og|tokenId|ver|paramsHash|ts")
    // We'll just use a colon-separated string for simplicity unless it gets too long
    const cacheKeyRaw = `og:${pinId}:${cacheVer}:${cacheParamsHash}:${cacheTs}`;
    // Simple hash to keep redis keys short? Or raw string. 
    // Requirement says: "Example: cacheKey = sha256(...)"
    const { createHash } = await import('crypto');
    const cacheKey = createHash('sha256').update(cacheKeyRaw).digest('hex');

    // 3. Check Cache
    const memCached = memoryCache.get(cacheKey);
    if (memCached && memCached.expires > Date.now()) {
        reply.header('Content-Type', 'image/png');
        reply.header('X-Cache', 'HIT-L1');
        reply.header('X-Cache-Key', cacheKey);
        return reply.send(memCached.data);
    }

    try {
        const cachedPng = await redis.getBuffer(cacheKey);
        if (cachedPng) {
            memoryCache.set(cacheKey, { data: cachedPng, expires: Date.now() + 60000 });
            reply.header('Content-Type', 'image/png');
            reply.header('X-Cache', 'HIT-L2');
            return reply.send(cachedPng);
        }
    } catch (e) {
        server.log.warn('Redis unavailable');
    }

    // 4. Acquire Lock
    const lockKey = `lock:${cacheKey}`;
    try {
        const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
        if (!acquired) {
            // Anti-stampede: Return stub or stale if we had one (we don't here)
            return reply.type('image/png').send(getStubImage('Rendering...'));
        }
    } catch (e) { }

    try {
        // 5. Fetch Pin Data
        // Always fetch base pin data (title, tagline, latest widget) as fallback or base
        const pin = await getPin(pinId);
        if (!pin) {
            return reply.type('image/png').send(getStubImage('Not Found'));
        }

        let uiCode = pin.widget?.reactCode;
        let baseProps = {
            ...(pin.widget?.previewData || {}),
            ...(pin.widget?.userConfig || {}),
        };

        // 6. Apply Authorized Bundle (Versioned Manifest + Params)
        if (authorizedBundle) {
            // If specific version requested, fetch manifest
            if (authorizedBundle.ver) {
                const manifest = await getManifest(authorizedBundle.ver);
                if (manifest && manifest.reactCode) {
                    uiCode = manifest.reactCode;
                    // Manifest previewData/userConfig overrides? 
                    // Usually manifest contains the CODE and Defaults.
                    baseProps = {
                        ...(manifest.previewData || {}),
                        ...(manifest.userConfig || {}),
                    };
                } else {
                    // Start of fallback: If manifest fetch fails, what do we do?
                    // "If ver manifest fetch fails -> Tier A preview (or stub)."
                    // We fall back to `pin.widget` (Tier A) which we already loaded.
                    // We effectively drop the authorized bundle if the manifest is bad.
                    console.error("Manifest fetch failed, falling back to latest");
                    authorizedBundle = null; // Disable custom params too if ver failed?
                    // Typically if ver fails, params might not match latest code. Safer to fallback fully.
                }
            }

            // Apply params if bundle matches or we are using compatible latest? 
            // If authorizedBundle is still valid
            if (authorizedBundle && authorizedBundle.params) {
                baseProps = { ...baseProps, ...authorizedBundle.params };
            }
        }

        if (!uiCode) {
            return reply.type('image/png').send(getStubImage('No Code'));
        }

        const props = {
            ...baseProps,
            title: pin.title,
            tagline: pin.tagline
        };

        // 7. Spawn Worker
        // ... (Existing worker reuse)
        const width = 1200;
        const height = 800;

        const workerCmd = path.join(__dirname, 'worker.js');
        const child = spawn('node', [workerCmd], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const inputPayload = JSON.stringify({ uiCode, props, width, height });
        child.stdin.write(inputPayload);
        child.stdin.end();

        const chunks: Buffer[] = [];
        const errChunks: Buffer[] = [];

        child.stdout.on('data', (chunk) => chunks.push(chunk));
        child.stderr.on('data', (chunk) => errChunks.push(chunk));

        const exitCode = await new Promise<number | null>((resolve) => {
            child.on('close', resolve);
            setTimeout(() => {
                child.kill('SIGKILL');
                resolve(-1);
            }, 2000);
        });

        if (exitCode !== 0) {
            throw new Error('Worker failed or timed out');
        }

        const pngBuffer = Buffer.concat(chunks);
        if (pngBuffer.length === 0) throw new Error('Empty output');

        // 8. Store Cache
        try {
            await redis.set(cacheKey, pngBuffer, 'EX', CACHE_TTL);
        } catch (e) { }
        memoryCache.set(cacheKey, { data: pngBuffer, expires: Date.now() + 60000 });

        reply.header('Content-Type', 'image/png');
        reply.header('X-Cache', 'MISS');
        return reply.send(pngBuffer);

    } catch (e) {
        server.log.error(e);
        return reply.type('image/png').send(getStubImage('Error'));
    } finally {
        try { await redis.del(lockKey); } catch (e) { }
    }
});

// Health
server.get('/health', async () => ({ status: 'ok' }));

// Start
const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server listening on port ${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
