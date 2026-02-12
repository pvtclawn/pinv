import fs from 'fs';
import path from 'path';

/**
 * Basic benchmark runner for PinV widget generation.
 * Reads the collected feedback dataset and prepares it for evaluation.
 */

const DATASET_PATH = path.join(__dirname, '../../web/gen-feedback/dataset.jsonl');

async function runBenchmark() {
    console.log("🚀 Starting PinV Generation Benchmark...");

    if (!fs.existsSync(DATASET_PATH)) {
        console.error("❌ Dataset not found at:", DATASET_PATH);
        console.log("   Generate some widgets and rate them in the UI first!");
        return;
    }

    const rawData = fs.readFileSync(DATASET_PATH, 'utf-8');
    const entries = rawData.trim().split('\n').map(line => JSON.parse(line));

    console.log(`📊 Found ${entries.length} feedback entries.`);

    // Summary stats
    const scores = entries.map(e => e.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    console.log(`📈 Average User Score: ${avgScore.toFixed(2)} / 5.0`);

    // Group by model
    const modelStats: Record<string, { count: number, totalScore: number }> = {};
    entries.forEach(e => {
        const model = e.model || 'unknown';
        if (!modelStats[model]) modelStats[model] = { count: 0, totalScore: 0 };
        modelStats[model].count++;
        modelStats[model].totalScore += e.score;
    });

    console.log("\n🏗️  Model Performance Breakdown:");
    Object.entries(modelStats).forEach(([model, stats]) => {
        const avg = stats.totalScore / stats.count;
        console.log(`   - ${model}: ${avg.toFixed(2)} (${stats.count} entries)`);
    });

    console.log("\n✅ Benchmark summary complete.");
}

runBenchmark().catch(console.error);
