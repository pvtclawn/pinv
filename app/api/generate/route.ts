import { Anthropic } from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { GENERATION_SYSTEM_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    try {
        const { prompt, contextParams } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const userContent = `
            User Prompt: ${prompt}
            
            Context Parameters:
            ${JSON.stringify(contextParams, null, 2)}
        `;

        console.log("----------------------------------------------------------------");
        console.log("[Generate Debug] System Prompt:", GENERATION_SYSTEM_PROMPT);
        console.log("[Generate Debug] User Content:", userContent);
        console.log("----------------------------------------------------------------");

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 10000,
            temperature: 0.2, // Lower temperature for consistent code
            system: GENERATION_SYSTEM_PROMPT,
            messages: [
                { role: "user", content: prompt }
            ],
        });

        const content = msg.content[0].type === 'text' ? msg.content[0].text : '';

        if (msg.content[0].type !== 'text') {
            return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
        }

        const textContent = msg.content[0].text;

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
    } catch (error) {
        console.error('Claude API Error:', error);
        return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 500 });
    }
}
