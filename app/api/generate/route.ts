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
            max_tokens: 3000,
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

        // Clean up markdown code blocks if present
        const cleanContent = textContent.replace(/```json\n?|```/g, '').trim();

        try {
            const result = JSON.parse(cleanContent);
            return NextResponse.json(result);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", textContent);
            return NextResponse.json({ error: 'Failed to generate valid JSON' }, { status: 500 });
        }
    } catch (error) {
        console.error('Claude API Error:', error);
        return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }
}
