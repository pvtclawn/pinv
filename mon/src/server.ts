/**
 * pinv-mon — Server
 * 
 * Hono-based HTTP server exposing:
 *   GET /             → Dashboard JSON overview
 *   GET /healthz      → Own health
 *   GET /services     → All service summaries
 *   GET /services/:n  → Single service detail (incl. history)
 *   GET /metrics      → Prometheus-format metrics for pinv-mon itself
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import client from 'prom-client';
import type { Collector } from './collector';
import { Aggregator } from './aggregator';

// Self-metrics registry
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'pinv_mon_' });

const pollDuration = new client.Histogram({
  name: 'pinv_mon_poll_duration_seconds',
  help: 'Duration of each polling cycle',
  registers: [register],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const targetStatus = new client.Gauge({
  name: 'pinv_mon_target_status',
  help: 'Target status (1=up, 0.5=degraded, 0=down)',
  labelNames: ['target', 'type'] as const,
  registers: [register],
});

const targetLatency = new client.Gauge({
  name: 'pinv_mon_target_latency_ms',
  help: 'Latest health check latency in ms',
  labelNames: ['target', 'type'] as const,
  registers: [register],
});

export function createServer(collector: Collector): Hono {
  const app = new Hono();
  const aggregator = new Aggregator(collector);

  app.use('*', cors());

  app.get('/healthz', (c) => c.text('ok'));

  app.get('/', (c) => {
    const overview = aggregator.getOverview();
    
    // Update Prometheus gauges
    for (const svc of overview.services) {
      const statusVal = svc.status === 'up' ? 1 : svc.status === 'degraded' ? 0.5 : 0;
      targetStatus.set({ target: svc.name, type: svc.type }, statusVal);
      targetLatency.set({ target: svc.name, type: svc.type }, svc.latency.current);
    }

    return c.json(overview);
  });

  app.get('/services', (c) => {
    const overview = aggregator.getOverview();
    return c.json(overview.services);
  });

  app.get('/services/:name', (c) => {
    const name = c.req.param('name');
    const state = collector.getTargetState(name);
    
    if (!state) {
      return c.json({ error: `Target '${name}' not found` }, 404);
    }

    const overview = aggregator.getOverview();
    const summary = overview.services.find(s => s.name === name);

    return c.json({
      summary,
      history: {
        health: state.health.slice(-50), // Last 50 health checks
        metrics: state.metrics.slice(-10), // Last 10 metric snapshots
      },
    });
  });

  app.get('/metrics', async (c) => {
    const metricsText = await register.metrics();
    return c.text(metricsText, 200, {
      'content-type': register.contentType,
    });
  });

  return app;
}
