/**
 * pinv-mon — E2E Preview Test
 * 
 * Polls the live OG engine with template code to verify end-to-end execution and rendering.
 * Run manually: PINV_E2E_TEST=1 bun test src/e2e.test.ts
 */

import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';

const SKIP = !process.env.PINV_E2E_TEST;
const OG_URL = 'https://pinv-og.fly.dev/og/preview';

const TEMPLATES = [
    { name: 'Crypto Ticker', dir: 'crypto-ticker', params: {} },
    { name: 'Wallet Portfolio', dir: 'wallet-portfolio', params: { address: '0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af' } },
    { name: 'ENS Profile', dir: 'ens-profile', params: { ens_name: 'pvtclawn.eth' } }
];

describe.skipIf(SKIP)('E2E Preview', () => {
  for (const template of TEMPLATES) {
    test(`renders ${template.name} correctly`, async () => {
      // Resolve path relative to project root
      const projectRoot = path.join(process.cwd(), '..');
      const dir = path.join(projectRoot, 'templates', template.dir);
      const dataCode = fs.readFileSync(path.join(dir, 'dataCode.js'), 'utf8');
      const uiCode = fs.readFileSync(path.join(dir, 'uiCode.jsx'), 'utf8');

      const response = await fetch(OG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              dataCode,
              uiCode,
              params: template.params
          })
      });

      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.image).toBeDefined();
      expect(data.image.length).toBeGreaterThan(1000);
      expect(data.result).toBeDefined();
    }, 30000);
  }
});
