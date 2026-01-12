import { serve, file } from 'bun';
import { join } from 'path';

const PORT = parseInt(process.env.PORT || '8080');
const ROOT = import.meta.dir;

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname === '/' ? '/index.html' : url.pathname;
        const filePath = join(ROOT, path);
        console.log(`[Mock] Req: ${req.url} -> Path: ${path} -> File: ${filePath}`);
        const f = file(filePath);

        if (await f.exists()) {
            console.log(`[Mock] Serving: ${filePath}`);
            return new Response(f);
        }
        console.log(`[Mock] 404 Not Found: ${filePath}`);
        return new Response('Not Found', { status: 404 });
    },
});

console.log(`[Mock IPFS] Serving ${ROOT} on port ${PORT}`);
