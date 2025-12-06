import { NextResponse } from 'next/server';
import { GENERATION_SYSTEM_PROMPT } from '@/lib/prompts';

async function generateText(
    provider: 'anthropic' | 'google',
    model: string,
    systemPrompt: string,
    userPrompt: string,
    apiKey: string
): Promise<string> {
    if (provider === 'google') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: userPrompt }]
                }],
                generationConfig: {
                    temperature: 1.0,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${err}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
        // Anthropic
        const url = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                temperature: 1.0,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Anthropic API Error: ${response.status} ${response.statusText} - ${err}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }
}

export async function POST(req: Request) {
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

        // Determine Provider and Model
        let provider: 'anthropic' | 'google' = 'anthropic';
        let model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
        let apiKey = process.env.ANTHROPIC_API_KEY;

        const llmModel = process.env.LLM_MODEL;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (llmModel && llmModel.toLowerCase().startsWith('gemini')) {
            provider = 'google';
            model = llmModel;
            apiKey = geminiKey;
        } else if (!process.env.ANTHROPIC_API_KEY && geminiKey) {
            // Fallback if no Anthropic key but Gemini key exists
            provider = 'google';
            model = llmModel || 'gemini-1.5-pro-latest';
            apiKey = geminiKey;
        }

        if (!apiKey) {
            return NextResponse.json({ error: `${provider.toUpperCase()}_API_KEY not set` }, { status: 500 });
        }

        console.log("----------------------------------------------------------------");
        console.log("[Generate Debug] System Prompt:", GENERATION_SYSTEM_PROMPT);
        console.log("[Generate Debug] User Content:", userContent);
        console.log("[Generate Debug] Provider:", provider);
        console.log("[Generate Debug] Model:", model);
        console.log("----------------------------------------------------------------");

        const textContent = await generateText(provider, model, GENERATION_SYSTEM_PROMPT, userContent, apiKey);

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
