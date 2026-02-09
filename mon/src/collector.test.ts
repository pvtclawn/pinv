import { describe, test, expect } from 'bun:test';
import { parsePrometheusText, Collector } from './collector';
import { Aggregator } from './aggregator';
import type { MonConfig } from './config';

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
