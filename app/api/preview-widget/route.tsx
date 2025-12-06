import { NextRequest } from 'next/server';
import { renderWidget } from '@/lib/widget-renderer';


export async function POST(req: NextRequest) {
  try {
    const { code, props } = await req.json();

    if (!code) return new Response("Missing code", { status: 400 });

    return await renderWidget(code, props);

  } catch (e: unknown) {
    console.error("Preview Route Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
}
