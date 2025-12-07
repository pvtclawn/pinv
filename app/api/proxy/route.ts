import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    try {
        console.log(`[LocalProxy] Fetching: ${url}`);

        // Forward headers from the client request
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            // Filter out headers that could cause issues or are managed by the fetch API/browser
            if (!['host', 'connection', 'content-length', 'transfer-encoding', 'cookie'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        // Ensure we identify as a proxy but keep original intent
        headers.set('User-Agent', req.headers.get('User-Agent') || 'PinV-Proxy/1.0');

        const response = await fetch(url, {
            headers: headers,
            cache: 'no-store' // Prevent caching proxy responses by default
        });

        const data = await response.arrayBuffer();

        // Forward response headers
        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
            // Filter potentially problematic response headers
            if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        // Ensure CORS and Content-Type
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        if (!responseHeaders.has('Content-Type')) {
            responseHeaders.set('Content-Type', 'application/octet-stream');
        }

        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });

    } catch (e: any) {
        console.error('[LocalProxy] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
