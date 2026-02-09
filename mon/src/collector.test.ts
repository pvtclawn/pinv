import { describe, test, expect } from 'bun:test';
import { parsePrometheusText, Collector } from './collector';
import { Aggregator } from './aggregator';
import { Alerter } from './alerter';
import { renderDashboard } from './dashboard';
import type { MonConfig } from './config';
import type { InputAttestation } from './collector';

describe('parsePrometheusText', () => {
  test('parses simple gauge', () => {
    const text = `
# HELP box_active_isolates Number of currently active isolates
# TYPE box_active_isolates gauge
box_active_isolates 3
`;
    const parsed = parsePrometheusText(text);
    expect(parsed['box_active_isolates']).toBe(3);
  });

  test('parses counter with labels', () => {
    const text = `
box_executions_total{status="success",code="200"} 42
box_executions_total{status="error",code="500"} 7
`;
    const parsed = parsePrometheusText(text);
    expect(parsed['box_executions_total{status="success",code="200"}']).toBe(42);
    expect(parsed['box_executions_total{status="error",code="500"}']).toBe(7);
  });

  test('parses histogram buckets', () => {
    const text = `
box_execution_duration_seconds_bucket{le="0.1"} 5
box_execution_duration_seconds_bucket{le="0.5"} 10
box_execution_duration_seconds_bucket{le="+Inf"} 15
box_execution_duration_seconds_sum 12.5
box_execution_duration_seconds_count 15
`;
    const parsed = parsePrometheusText(text);
    expect(parsed['box_execution_duration_seconds_sum']).toBe(12.5);
    expect(parsed['box_execution_duration_seconds_count']).toBe(15);
  });

  test('handles scientific notation', () => {
    const text = `box_process_resident_memory_bytes 1.2e+8`;
    const parsed = parsePrometheusText(text);
    expect(parsed['box_process_resident_memory_bytes']).toBe(1.2e8);
  });

  test('skips empty lines and comments', () => {
    const text = `
# HELP test
# TYPE test gauge

test_metric 42

# Another comment
`;
    const parsed = parsePrometheusText(text);
    expect(Object.keys(parsed).length).toBe(1);
    expect(parsed['test_metric']).toBe(42);
  });
});

describe('Collector', () => {
  test('initializes with targets from config', () => {
    const config: MonConfig = {
      port: 6666,
      pollIntervalMs: 60000,
      requestTimeoutMs: 5000,
      historySize: 10,
      targets: [
        { name: 'test-og', type: 'og', url: 'http://localhost:4444', healthPath: '/healthz' },
        { name: 'test-box', type: 'box', url: 'http://localhost:5555', healthPath: '/healthz', metricsPath: '/metrics' },
      ],
    };

    const collector = new Collector(config);
    const state = collector.getState();
    expect(state.size).toBe(2);
    expect(state.get('test-og')?.config.type).toBe('og');
    expect(state.get('test-box')?.config.metricsPath).toBe('/metrics');
  });
});

describe('Aggregator', () => {
  test('computes overview with no health data', () => {
    const config: MonConfig = {
      port: 6666,
      pollIntervalMs: 60000,
      requestTimeoutMs: 5000,
      historySize: 10,
      targets: [
        { name: 'test', type: 'web', url: 'http://localhost:3000', healthPath: '/api/health' },
      ],
    };

    const collector = new Collector(config);
    const aggregator = new Aggregator(collector);
    const overview = aggregator.getOverview();

    expect(overview.services.length).toBe(1);
    expect(overview.services[0].status).toBe('unknown');
    expect(overview.services[0].uptime.totalChecks).toBe(0);
  });

  test('overall status reflects worst service', () => {
    const config: MonConfig = {
      port: 6666,
      pollIntervalMs: 60000,
      requestTimeoutMs: 5000,
      historySize: 10,
      targets: [
        { name: 'up-svc', type: 'web', url: 'http://localhost:3000', healthPath: '/h' },
        { name: 'down-svc', type: 'og', url: 'http://localhost:4444', healthPath: '/h' },
      ],
    };

    const collector = new Collector(config);
    
    // Manually inject health data
    const upState = collector.getTargetState('up-svc')!;
    upState.health.push({ timestamp: Date.now(), status: 'up', latencyMs: 50 });
    
    const downState = collector.getTargetState('down-svc')!;
    downState.health.push({ timestamp: Date.now(), status: 'down', latencyMs: 5000, error: 'timeout' });

    const aggregator = new Aggregator(collector);
    const overview = aggregator.getOverview();
    
    expect(overview.overall).toBe('down');
  });

  test('computes latency percentiles correctly', () => {
    const config: MonConfig = {
      port: 6666,
      pollIntervalMs: 60000,
      requestTimeoutMs: 5000,
      historySize: 100,
      targets: [
        { name: 'svc', type: 'box', url: 'http://localhost:5555', healthPath: '/h' },
      ],
    };

    const collector = new Collector(config);
    const state = collector.getTargetState('svc')!;
    
    // Add 20 health checks with varying latencies
    for (let i = 1; i <= 20; i++) {
      state.health.push({
        timestamp: Date.now(),
        status: 'up',
        latencyMs: i * 10, // 10, 20, ..., 200
      });
    }

    const aggregator = new Aggregator(collector);
    const overview = aggregator.getOverview();
    const svc = overview.services[0];

    expect(svc.latency.min).toBe(10);
    expect(svc.latency.max).toBe(200);
    expect(svc.latency.avg).toBe(105);
    expect(svc.latency.p95).toBe(190); // 95th percentile of 10..200
    expect(svc.uptime.percent).toBe(100);
  });
});

// ========================================
// Alerter
// ========================================
describe('Alerter', () => {
  test('fires critical alert after consecutive downs', async () => {
    const alerter = new Alerter({ downThreshold: 2 });

    // First down — no alert yet
    let alerts = await alerter.evaluate([{
      name: 'og', type: 'og', status: 'down', url: 'http://x',
      latency: { current: 0, avg: 0, p95: 0, min: 0, max: 0 },
      uptime: { percent: 0, totalChecks: 1, upChecks: 0, downChecks: 1, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);
    expect(alerts.length).toBe(0);

    // Second down — alert fires
    alerts = await alerter.evaluate([{
      name: 'og', type: 'og', status: 'down', url: 'http://x',
      latency: { current: 0, avg: 0, p95: 0, min: 0, max: 0 },
      uptime: { percent: 0, totalChecks: 2, upChecks: 0, downChecks: 2, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);
    expect(alerts.length).toBe(1);
    expect(alerts[0].level).toBe('critical');
    expect(alerts[0].message).toContain('DOWN');
  });

  test('resets down counter when service recovers', async () => {
    const alerter = new Alerter({ downThreshold: 2 });

    // One down
    await alerter.evaluate([{
      name: 'og', type: 'og', status: 'down', url: 'http://x',
      latency: { current: 0, avg: 0, p95: 0, min: 0, max: 0 },
      uptime: { percent: 0, totalChecks: 1, upChecks: 0, downChecks: 1, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);

    // Recovery
    await alerter.evaluate([{
      name: 'og', type: 'og', status: 'up', url: 'http://x',
      latency: { current: 100, avg: 100, p95: 100, min: 100, max: 100 },
      uptime: { percent: 50, totalChecks: 2, upChecks: 1, downChecks: 1, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);

    // Another down — counter reset, no alert
    const alerts = await alerter.evaluate([{
      name: 'og', type: 'og', status: 'down', url: 'http://x',
      latency: { current: 0, avg: 0, p95: 0, min: 0, max: 0 },
      uptime: { percent: 33, totalChecks: 3, upChecks: 1, downChecks: 2, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);
    expect(alerts.length).toBe(0);
  });

  test('fires latency warning', async () => {
    const alerter = new Alerter({ latencyWarnMs: 500, latencyCritMs: 2000 });

    const alerts = await alerter.evaluate([{
      name: 'box', type: 'box', status: 'up', url: 'http://x',
      latency: { current: 800, avg: 400, p95: 800, min: 100, max: 800 },
      uptime: { percent: 100, totalChecks: 10, upChecks: 10, downChecks: 0, degradedChecks: 0 },
      lastCheck: Date.now(), keyMetrics: {},
    }]);
    expect(alerts.length).toBe(1);
    expect(alerts[0].level).toBe('warn');
  });
});

// ========================================
// Dashboard HTML
// ========================================
describe('renderDashboard', () => {
  test('renders valid HTML with service cards', () => {
    const html = renderDashboard({
      timestamp: Date.now(),
      overall: 'healthy',
      services: [{
        name: 'og', type: 'og', status: 'up', url: 'https://pinv-og.fly.dev',
        latency: { current: 120, avg: 130, p95: 200, min: 80, max: 300 },
        uptime: { percent: 99.5, totalChecks: 200, upChecks: 199, downChecks: 1, degradedChecks: 0 },
        lastCheck: Date.now(), keyMetrics: {},
      }],
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('pinv-mon');
    expect(html).toContain('🟢');
    expect(html).toContain('og');
    expect(html).toContain('99.5%');
  });

  test('renders empty state', () => {
    const html = renderDashboard({
      timestamp: Date.now(),
      overall: 'healthy',
      services: [],
    });
    expect(html).toContain('No targets configured');
  });
});
