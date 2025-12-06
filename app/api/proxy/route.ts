import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // TODO: SECURITY: For production, we should implement a domain whitelist
    // to prevent SSRF attacks. e.g. only allow api.github.com, api.coingecko.com, etc.
    // or rate limit the IP address.

    try {
        console.log(`[LocalProxy] Fetching: ${url}`);
        const response = await fetch(url, {
            headers: {
                // Determine if we need to pass specific headers?
                // For MVP, we strip most to avoid issues, or pass a minimal set.
                'User-Agent': 'PinV-Proxy/1.0',
                'Accept': 'application/json, text/plain, */*',
            }
        });

        const data = await response.arrayBuffer(); // Get raw data to support images etc if needed

        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*', // Allow client to read this
            }
        });

    } catch (e: any) {
        console.error('[LocalProxy] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
