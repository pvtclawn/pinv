/**
 * pinv-mon — Live integration test
 * 
 * Polls real PinV services once and prints results.
 * Run manually: PINV_LIVE_TEST=1 bun test src/live.test.ts
 */

import { describe, test, expect } from 'bun:test';
import { Collector } from './collector';
import { Aggregator } from './aggregator';
import type { MonConfig } from './config';

const SKIP = !process.env.PINV_LIVE_TEST;

describe.skipIf(SKIP)('Live integration', () => {
  test('polls all 3 live services', async () => {
    const config: MonConfig = {
      port: 0,
      pollIntervalMs: 999999, // manual poll only
      requestTimeoutMs: 15000,
      historySize: 10,
      targets: [
        { name: 'web', type: 'web', url: 'https://www.pinv.app', healthPath: '/' },
        { name: 'og', type: 'og', url: 'https://pinv-og.fly.dev', healthPath: '/healthz' },
        {
          name: 'box', type: 'box',
          url: 'https://abc63ee90f991a2b0932b94a94dd84c4048156b2-8080.dstack-pha-prod9.phala.network',
          healthPath: '/healthz',
          metricsPath: '/metrics',
          authKey: process.env.PINV_BOX_AUTH_KEY,
        },
      ],
    };

    const collector = new Collector(config);
    await collector.pollAll();

    const aggregator = new Aggregator(collector);
    const overview = aggregator.getOverview();

    console.log('\n=== Live Poll Results ===');
    for (const svc of overview.services) {
      console.log(`${svc.status === 'up' ? '✅' : '❌'} ${svc.name} (${svc.type}): ${svc.status} ${Math.round(svc.latency.current)}ms`);
      if (Object.keys(svc.keyMetrics).length > 0) {
        console.log('  Metrics:', JSON.stringify(svc.keyMetrics, null, 2).slice(0, 200));
      }
    }
    console.log(`Overall: ${overview.overall}\n`);

    expect(overview.services.length).toBe(3);
    // At least web and og should be up
    const web = overview.services.find(s => s.name === 'web');
    const og = overview.services.find(s => s.name === 'og');
    expect(web?.status).toBe('up');
    expect(og?.status).toBe('up');
  }, 30000);
});
