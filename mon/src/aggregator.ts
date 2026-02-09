/**
 * pinv-mon — Aggregator
 * 
 * Computes derived metrics and summaries from raw collector state.
 * Provides the data layer for the dashboard API.
 */

import type { Collector, TargetState, HealthSnapshot } from './collector';

export interface ServiceSummary {
  name: string;
  type: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  url: string;
  latency: {
    current: number;
    avg: number;
    p95: number;
    min: number;
    max: number;
  };
  uptime: {
    percent: number;
    totalChecks: number;
    upChecks: number;
    downChecks: number;
    degradedChecks: number;
  };
  lastCheck: number;
  /** Selected Prometheus metrics (box only for now) */
  keyMetrics: Record<string, number>;
}

export interface SystemOverview {
  timestamp: number;
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceSummary[];
}

export class Aggregator {
  constructor(private collector: Collector) {}

  /** Build a full system overview */
  getOverview(): SystemOverview {
    const services: ServiceSummary[] = [];
    
    for (const [, state] of this.collector.getState()) {
      services.push(this.summarize(state));
    }

    // Overall status: worst of all services
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    for (const svc of services) {
      if (svc.status === 'down') { overall = 'down'; break; }
      if (svc.status === 'degraded') overall = 'degraded';
    }

    return {
      timestamp: Date.now(),
      overall,
      services,
    };
  }

  /** Summarize a single target's state */
  private summarize(state: TargetState): ServiceSummary {
    const health = state.health;
    const latencies = health.map(h => h.latencyMs);
    const lastHealth = health[health.length - 1];
    
    const upChecks = health.filter(h => h.status === 'up').length;
    const downChecks = health.filter(h => h.status === 'down').length;
    const degradedChecks = health.filter(h => h.status === 'degraded').length;

    // Key metrics from latest Prometheus snapshot
    const keyMetrics: Record<string, number> = {};
    const lastMetrics = state.metrics[state.metrics.length - 1];
    if (lastMetrics?.parsed) {
      // Box metrics we care about
      const interesting = [
        'box_executions_total',
        'box_active_isolates',
        'box_pool_size',
        'box_pool_queue_length',
        'box_isolates_poisoned_total',
        'box_execution_duration_seconds_sum',
        'box_execution_duration_seconds_count',
        // Process metrics
        'box_process_cpu_seconds_total',
        'box_process_resident_memory_bytes',
        'box_nodejs_heap_size_used_bytes',
        'box_nodejs_active_handles_total',
      ];

      for (const [key, value] of Object.entries(lastMetrics.parsed)) {
        // Include exact matches or labeled variants
        const baseKey = key.replace(/\{[^}]*\}/, '');
        if (interesting.includes(baseKey) || interesting.includes(key)) {
          keyMetrics[key] = value;
        }
      }
    }

    return {
      name: state.config.name,
      type: state.config.type,
      status: lastHealth?.status ?? 'unknown',
      url: state.config.url,
      latency: {
        current: lastHealth?.latencyMs ?? 0,
        avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        p95: percentile(latencies, 95),
        min: latencies.length ? Math.min(...latencies) : 0,
        max: latencies.length ? Math.max(...latencies) : 0,
      },
      uptime: {
        percent: health.length ? (upChecks / health.length) * 100 : 0,
        totalChecks: health.length,
        upChecks,
        downChecks,
        degradedChecks,
      },
      lastCheck: state.lastPoll,
      keyMetrics,
    };
  }
}

/** Compute percentile from sorted array */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
