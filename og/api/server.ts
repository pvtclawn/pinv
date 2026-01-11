import fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, CHAIN_ID, CONTRACT_ADDRESS } from '../utils/constants';
import { previewHandler, getPinHandler } from './controllers';

import { logToFile } from '../utils/logger';

const server = fastify({
    logger: true,
    disableRequestLogging: false
});

// ... (middleware)

// Global Handlers
process.on('unhandledRejection', (reason, promise) => {
    const msg = `[OG Engine] Unhandled Rejection: ${reason}`;
    console.error(msg);
    logToFile(msg);
});

process.on('uncaughtException', (err) => {
    const msg = `[OG Engine] Uncaught Exception: ${err.message}`;
    console.error(msg);
    logToFile(msg);
});

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        const msg = `Server listening on port ${PORT} | IPFS: ${process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'Default'}`;
        console.log(msg);
        logToFile(msg);
    } catch (err) {
        server.log.error(err);
        logToFile(`Server Startup Failed: ${err}`);
        process.exit(1);
    }
};

server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
});

// Endpoint for Unified Preview (Executes Data Code + Renders Image)
server.post('/og/preview', previewHandler);

// OG Route
server.get<{
    Params: { pinId: string }, Querystring: {
        t: any; b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string
    }
}>('/og/:pinId', getPinHandler);

// Health
server.get('/health', async () => ({ status: 'ok' }));

console.log(`[OG Engine] Starting on Port: ${PORT}`);
console.log(`[OG Engine] Chain ID: ${CHAIN_ID}`);
console.log(`[OG Engine] Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`[OG Engine] IPFS Gateway: ${process.env.NEXT_PUBLIC_IPFS_GATEWAY || '(Using Default)'}`);
console.log('------------------------------------------------');

start();
