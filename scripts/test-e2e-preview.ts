import fs from 'fs';
import path from 'path';

const OG_URL = 'https://pinv-og.fly.dev/og/preview';

const TEMPLATES = [
    { name: 'Crypto Ticker', dir: 'crypto-ticker', params: {} },
    { name: 'Wallet Portfolio', dir: 'wallet-portfolio', params: { address: '0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af' } },
    { name: 'ENS Profile', dir: 'ens-profile', params: { ens_name: 'pvtclawn.eth' } }
];

async function testTemplate(template: typeof TEMPLATES[0]) {
    console.log(`\n--- Testing Template: ${template.name} ---`);

    const dir = path.join(process.cwd(), 'templates', template.dir);
    const dataCodePath = path.join(dir, 'dataCode.js');
    const uiCodePath = path.join(dir, 'uiCode.jsx');

    if (!fs.existsSync(dataCodePath) || !fs.existsSync(uiCodePath)) {
        console.error(`  ❌ Template files not found for ${template.dir}!`);
        return false;
    }

    const dataCode = fs.readFileSync(dataCodePath, 'utf8');
    const uiCode = fs.readFileSync(uiCodePath, 'utf8');

    const startTime = Date.now();
    try {
        const response = await fetch(OG_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dataCode,
                uiCode,
                params: template.params
            })
        });

        const duration = Date.now() - startTime;
        console.log(`  Response status: ${response.status} (${duration}ms)`);

        if (!response.ok) {
            const err = await response.text();
            console.error('  ❌ Request failed:', err);
            return false;
        }

        const data: any = await response.json();
        
        if (data.image) {
            console.log(`  ✅ SUCCESS: Image generated (${Math.round(data.image.length / 1024)} KB)`);
            return true;
        } else {
            console.error('  ❌ FAILED: No image returned');
            return false;
        }

    } catch (e: any) {
        console.error('  ❌ Error:', e.message);
        return false;
    }
}

async function run() {
    console.log('--- PinV E2E Multi-Template Test ---');
    let passed = 0;
    for (const t of TEMPLATES) {
        if (await testTemplate(t)) passed++;
    }
    console.log(`\n--- Summary: ${passed}/${TEMPLATES.length} passed ---`);
    if (passed < TEMPLATES.length) process.exit(1);
}

run();
