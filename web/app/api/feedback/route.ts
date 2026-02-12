import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { scrubSecrets } from '@/lib/utils/scrub';

/**
 * Endpoint to collect RLHF-style feedback for widget generations.
 * Saves data to a local JSONL file for research and prompt tuning.
 */
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { generationId, prompt, result, score, feedback, model, status, error } = data;

        if (!score || score < 1 || score > 5) {
            return NextResponse.json({ error: 'Valid score (1-5) is required' }, { status: 400 });
        }

        // Scrub sensitive data before saving to dataset
        const entry = {
            id: generationId || crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            prompt: scrubSecrets(prompt),
            result: scrubSecrets(result),
            score,
            feedback: feedback ? scrubSecrets(feedback) : null,
            model,
            status: status || 'success',
            error: error ? scrubSecrets(error) : null
        };

        // Ensure directory exists
        const dir = path.join(process.cwd(), 'gen-feedback');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        const filePath = path.join(dir, 'dataset.jsonl');
        fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');

        console.log(`[Feedback] Saved score ${score} for generation ${entry.id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Feedback] Save Error:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
