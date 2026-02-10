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

// Simple in-memory rate limiting (P0 defense)
// Note: Reset on Vercel cold starts, but provides basic protection
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const LIMIT = 5; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'local';
        const now = Date.now();
        const userLimit = rateLimitMap.get(ip);

        if (userLimit && now < userLimit.resetAt) {
            if (userLimit.count >= LIMIT) {
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
            userLimit.count++;
        } else {
            rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        }

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
