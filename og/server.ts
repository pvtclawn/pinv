import fastify from 'fastify';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { getPin } from './lib/pin';


// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

// Environment & Config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = 60; // 1 minute
const LOCK_TTL = 10;
const PORT = parseInt(process.env.PORT || '8080');
const TIMESTAMP_BUCKET_MS = parseInt(process.env.TIMESTAMP_BUCKET_MS || '2000'); // 2 seconds bucketing

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
import { computeParamsHash } from '../lib/og-common';

import { executeLitAction } from './lib/executor';

import cors from '@fastify/cors';

const server = fastify({
    logger: true,
    disableRequestLogging: false
});

server.register(cors, {
    origin: true, // Allow all for dev simplicity, or specify ['http://localhost:3000']
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
});

// Endpoint for executing Data Code (Lit Actions)
server.post('/execute', async (req, reply) => {
    try {
        const { code, params } = req.body as { code: string, params: any };
        if (!code) {
            return reply.status(400).send({ error: "Missing code" });
        }

        console.log(`[OG] Executing Data Code...`);
        // executeLitAction now returns { result, logs }
        const { result, logs } = await executeLitAction(code, params || {});

        return reply.send({ result, logs });
    } catch (e: any) {
        req.log.error(e);
        return reply.status(500).send({ error: "Execution failed", logs: [e.message] });
    }
});

// Log Configuration on Startup
import { pinVAddress } from './lib/contracts';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532') as 8453 | 84532;
const CONTRACT_ADDRESS = pinVAddress[CHAIN_ID] || pinVAddress[84532];

console.log('------------------------------------------------');
console.log(`[OG Engine] Starting on Port: ${PORT}`);
console.log(`[OG Engine] Chain ID: ${CHAIN_ID}`);
console.log(`[OG Engine] Contract Address: ${CONTRACT_ADDRESS}`);
console.log('------------------------------------------------');

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

// Helper: Poll for Cache
async function pollForCache(key: string, interval: number = 500, timeout: number = 10000): Promise<Buffer | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const cached = await redis.getBuffer(key);
            if (cached) return cached;
        } catch (e) { }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    return null;
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
    // 1. Parse & Verify Bundle (if present)
    if (b) {
        const bundle = parseBundle(b);
        if (bundle) {
            if (sig) {
                // Verify Signature
                const signer = await verifySignature(pinId, bundle, sig);
                if (signer) {
                    // Verify Ownership (Strict Mode)
                    let isOwner = false;
                    if (pinId === 0) {
                        server.log.info(`[Auth] Preview Mode (Pin 0): Skipping chain ownership check for ${signer}`);
                        isOwner = true;
                    } else {
                        isOwner = await checkOwnership(signer, pinId);
                    }

                    if (isOwner) {
                        server.log.info(`[Auth] Bundle authorized for pin ${pinId} by ${signer}`);
                        authorizedBundle = bundle;
                        cacheVer = bundle.ver || 'latest';
                        cacheTs = bundle.ts ? String(bundle.ts) : '';
                        if (bundle.params) {
                            cacheParamsHash = computeParamsHash(bundle.params);
                        }
                    } else {
                        server.log.warn(`[Auth] Ownership Failed: Signer ${signer} does not own pin ${pinId}`);
                    }
                } else {
                    server.log.warn(`[Auth] Signature Verification Failed for pin ${pinId}`);
                }
            } else {
                // Unsigned Bundle (User Request: "No need for security for now!")
                // valid for public viewing if we just want to render the manifest + params
                server.log.info(`[Auth] Unsigned Bundle accepted for Pin ${pinId}`);
                authorizedBundle = bundle;
                cacheVer = bundle.ver || 'latest';
                cacheTs = bundle.ts ? String(bundle.ts) : '';
                if (bundle.params) {
                    cacheParamsHash = computeParamsHash(bundle.params);
                }
            }
        }
    }

    // 2. Compute Cache Key
    // cacheParamsHash for Bundle is already computed.
    // We need to mix in Overrides (for Unbundled/Stored Pin requests)
    let overridesHash = '';
    const queryParams = request.query as Record<string, string>;
    const overrides: Record<string, string> = {};
    const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId'];
    // Re-extract overrides here to ensure availability for cache key
    Object.keys(queryParams).forEach(key => {
        if (!reservedKeys.includes(key)) {
            // Apply bucketing to timestamp 't' if configured
            if (key === 't' && TIMESTAMP_BUCKET_MS > 0) {
                const ts = parseInt(queryParams[key]);
                if (!isNaN(ts)) {
                    overrides[key] = String(Math.floor(ts / TIMESTAMP_BUCKET_MS) * TIMESTAMP_BUCKET_MS);
                    return;
                }
            }
            overrides[key] = queryParams[key];
        }
    });

    if (Object.keys(overrides).length > 0) {
        overridesHash = computeParamsHash(overrides);
    }

    // cacheKey = sha256("og:v2|tokenId|ver|paramsHash|overridesHash|ts")
    const cacheKeyRaw = `og:v2:${pinId}:${cacheVer}:${cacheParamsHash}:${overridesHash}:${cacheTs}`;
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
            console.log(`[OG] Lock Contention for ${cacheKey}. Polling for result...`);
            const polledResult = await pollForCache(cacheKey);
            if (polledResult) {
                console.log(`[OG] Polling Success: Retrieved cached result for ${cacheKey}`);
                memoryCache.set(cacheKey, { data: polledResult, expires: Date.now() + 60000 });
                reply.header('Content-Type', 'image/png');
                reply.header('X-Cache', 'HIT-POLL');
                return reply.send(polledResult);
            }

            // Anti-stampede: Return stub or stale if we had one (we don't here)
            console.warn(`[OG] Returning Stub: Rendering in progress (Lock Contention for key ${cacheKey})`);
            return reply.type('image/png').send(getStubImage('Rendering...'));
        }
    } catch (e) { }

    try {
        // 5. Fetch Pin Data
        // Always fetch base pin data (title, tagline, latest widget) as fallback or base
        let pin = null;
        if (pinId === 0) {
            // Mock Pin for Preview
            pin = {
                id: 0,
                title: "Preview",
                tokenURI: "",
                widget: { uiCode: "", previewData: {}, userConfig: {} }
            };
        } else {
            pin = await getPin(pinId);
        }

        if (!pin) {
            return reply.type('image/png').send(getStubImage('Not Found'));
        }

        let uiCode = pin.widget?.uiCode;
        let baseProps = {
            ...(pin.widget?.previewData || {}),
            ...(pin.widget?.userConfig || {}),
        };

        // 6. Apply Authorized Bundle (Versioned Manifest + Params)
        // OR Standard Execution for Stored Pin

        // 6a. Extract Query Params as Overrides (for Viewer interactivity)
        const queryParams = request.query as Record<string, string>;
        const overrides: Record<string, string> = {};
        const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId', 't'];
        Object.keys(queryParams).forEach(key => {
            if (!reservedKeys.includes(key)) {
                overrides[key] = queryParams[key];
            }
        });

        if (authorizedBundle) {
            // ... (Bundle logic remains similar, but we should also respect overrides if secure?)
            // For now, Bundle takes precedence for versioning, but we might want overrides on top?
            // If it's a signed bundle, we usually want EXACT reproduction.
            // But if it's an unsigned bundle (preview), we might want overrides.

            // Existing Bundle Logic:
            if (authorizedBundle.ver) {
                const manifest = await getManifest(authorizedBundle.ver);
                if (manifest && manifest.uiCode) {
                    uiCode = manifest.uiCode;
                    baseProps = {
                        ...(manifest.previewData || {}),
                        ...(manifest.userConfig || {}),
                    };
                } else {
                    console.log("Manifest fetch failed, falling back to latest");
                    authorizedBundle = null; // Fallback to pin
                }
            }

            if (authorizedBundle && authorizedBundle.params) {
                const dataCode = authorizedBundle.ver ? (await getManifest(authorizedBundle.ver))?.dataCode : pin.widget?.dataCode;
                const paramsToRun = { ...authorizedBundle.params, ...overrides }; // Allow overrides on bundle?

                if (dataCode) {
                    console.log(`[OG] Executing Data Code for Bundle Pin ${pinId}...`);
                    const { result, logs } = await executeLitAction(dataCode, paramsToRun);
                    if (result) {
                        // Merge result. result usually contains { temperature: 20 }. 
                        // baseProps might contain inputs. result overwrites/augments them.
                        baseProps = { ...baseProps, ...result };
                    }
                } else {
                    baseProps = { ...baseProps, ...authorizedBundle.params };
                }
            }
        } else {
            // 6b. Standard Stored Pin Execution (The Fix for Viewer)
            // Use stored dataCode and previewData + Overrides
            const dataCode = pin.widget?.dataCode;
            const storedParams = pin.widget?.previewData || {};
            const paramsToRun = { ...storedParams, ...overrides };

            if (dataCode) {
                console.log(`[OG] Executing Stored Data Code for Pin ${pinId}...`);
                const { result, logs } = await executeLitAction(dataCode, paramsToRun);
                if (result) {
                    console.log(`[OG] Stored Execution Success`);
                    baseProps = { ...baseProps, ...result };
                } else {
                    console.warn(`[OG] Stored Execution returned null result`);
                }
            } else {
                // No data code, just pass params
                baseProps = { ...baseProps, ...paramsToRun };
            }
        }

        if (!uiCode) {
            console.warn(`[OG] Returning Stub: No UI Code found for Pin ${pinId}`);
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
        // Use 'bun' instead of 'node' since we are in a Bun runtime
        const child = spawn('bun', [workerCmd], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const inputPayload = JSON.stringify({
            uiCode,
            props,
            width,
            height,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        });

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
            }, 10000);
        });

        if (exitCode !== 0) {
            const errorOutput = Buffer.concat(errChunks).toString();
            console.error(`[OG] Worker failed with code ${exitCode}: ${errorOutput}`);
            if (uiCode) fs.writeFileSync(path.join(__dirname, 'debug_payload.txt'), uiCode);
            console.warn(`[OG] Returning Stub: Render Error (Worker Exit Code ${exitCode})`);
            return reply.type('image/png').send(getStubImage('Render Error'));
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
        console.error(e);
        console.warn(`[OG] Returning Stub: Server Error (${(e as Error).message})`);
        return reply.type('image/png').send(getStubImage('Server Error'));
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
