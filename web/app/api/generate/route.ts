import { NextResponse } from 'next/server';
import { GENERATION_SYSTEM_PROMPT } from '@/lib/prompts';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { env } from "@/env";

async function generateText(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    apiKey: string
): Promise<string> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': NEXT_PUBLIC_APP_URL,
            'X-Title': 'PinV',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 10000,
            temperature: 1.0,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        let errText = '';
        try {
            errText = await response.text();
        } catch (e) {
            errText = response.statusText;
        }
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// Rate limiting with daily global budget + per-IP sliding window
// In-memory: resets on Vercel cold starts, but catches sustained abuse
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const IP_LIMIT = 5; // max requests per IP per window
const IP_WINDOW_MS = 60 * 1000; // 1 minute

// Global budget: prevent total API spend from spiraling
let globalRequestCount = 0;
let globalResetAt = Date.now() + 24 * 60 * 60 * 1000; // 24h window
const GLOBAL_DAILY_LIMIT = 200; // max generations per day across all users

// Periodic cleanup to prevent memory leak from stale IPs
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 min
let lastCleanup = Date.now();

function cleanupStaleLimits(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [ip, entry] of rateLimitMap) {
        if (now >= entry.resetAt) rateLimitMap.delete(ip);
    }
}

export async function POST(req: Request) {
    try {
        const now = Date.now();
        cleanupStaleLimits(now);

        // Global daily budget check
        if (now >= globalResetAt) {
            globalRequestCount = 0;
            globalResetAt = now + 24 * 60 * 60 * 1000;
        }
        if (globalRequestCount >= GLOBAL_DAILY_LIMIT) {
            return NextResponse.json({ error: 'Daily generation limit reached. Try again tomorrow.' }, { status: 429 });
        }

        // Per-IP rate limiting
        // Use x-real-ip (set by Vercel from actual connection) over x-forwarded-for
        // (which can be spoofed by the client via proxy headers)
        const ip = req.headers.get('x-real-ip')
            || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || 'local';
        const userLimit = rateLimitMap.get(ip);

        if (userLimit && now < userLimit.resetAt) {
            if (userLimit.count >= IP_LIMIT) {
                return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
            }
            userLimit.count++;
        } else {
            rateLimitMap.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
        }

        globalRequestCount++;

        const { prompt, contextParams } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const userContent = `
            User Prompt: ${prompt}
            
            Context Parameters:
            ${JSON.stringify(contextParams, null, 2)}
        `;

        const model = env.LLM_MODEL;
        const apiKey = env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 });
        }

        if (process.env.NODE_ENV === 'development') {
            console.log("----------------------------------------------------------------");
            console.log("[Generate Debug] System Prompt:", GENERATION_SYSTEM_PROMPT);
            console.log("[Generate Debug] User Content:", userContent);
            console.log("[Generate Debug] Model:", model);
            console.log("----------------------------------------------------------------");
        }

        const textContent = await generateText(model, GENERATION_SYSTEM_PROMPT, userContent, apiKey);

        // Robustly extract JSON: Find first '{' and last '}'
        const firstOpen = textContent.indexOf('{');
        const lastClose = textContent.lastIndexOf('}');

        if (firstOpen === -1 || lastClose === -1) {
            console.error("No JSON object found in response:", textContent);
            return NextResponse.json({
                error: 'Generation incomplete. Please try again.',
                details: 'The AI response was truncated or invalid.'
            }, { status: 500 });
        }

        const cleanContent = textContent.substring(firstOpen, lastClose + 1);

        try {
            const result = JSON.parse(cleanContent);
            return NextResponse.json(result);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", cleanContent);
            return NextResponse.json({
                error: 'Failed to parse generated code',
                details: 'The AI produced invalid JSON. Please try again.'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('AI API Error:', error);
        return NextResponse.json({
            error: 'Failed to connect to AI service',
            details: error.message
        }, { status: 500 });
    }
}
