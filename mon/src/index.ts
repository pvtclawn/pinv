/**
 * pinv-mon — Entry point
 * 
 * Unified monitoring for PinV services (web, og, box).
 */

import { loadConfig } from './config';
import { Collector } from './collector';
import { createServer } from './server';

const config = loadConfig();

if (config.targets.length === 0) {
  console.error('[pinv-mon] No targets configured. Set PINV_MON_TARGETS, or PINV_WEB_URL / PINV_OG_URL / PINV_BOX_URL.');
  console.log('[pinv-mon] Example:');
  console.log('  PINV_OG_URL=https://pinv-og.fly.dev PINV_BOX_URL=https://box.example.com bun src/index.ts');
  process.exit(1);
}

console.log(`[pinv-mon] Starting with ${config.targets.length} target(s):`);
for (const t of config.targets) {
  console.log(`  • ${t.name} (${t.type}) → ${t.url}${t.healthPath}`);
}

const collector = new Collector(config);
const app = createServer(collector);

// Start collector
collector.start();

// Start HTTP server
const port = config.port;
console.log(`[pinv-mon] Dashboard listening on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
