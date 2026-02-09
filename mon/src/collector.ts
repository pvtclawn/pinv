/**
 * pinv-mon — Collector
 * 
 * Polls each target for health and metrics.
 * Parses Prometheus text format from box /metrics.
 * Stores time-series snapshots.
 */

import type { TargetConfig, MonConfig } from './config';

export interface HealthSnapshot {
  timestamp: number;
  status: 'up' | 'down' | 'degraded';
  latencyMs: number;
  statusCode?: number;
  error?: string;
}

export interface MetricsSnapshot {
  timestamp: number;
  raw?: string;
  parsed: Record<string, number>;
}

export interface TargetState {
  config: TargetConfig;
  health: HealthSnapshot[];
  metrics: MetricsSnapshot[];
  lastPoll: number;
}

export class Collector {
  private state: Map<string, TargetState> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly historySize: number;
  private readonly timeoutMs: number;

  constructor(private config: MonConfig) {
    this.historySize = config.historySize;
    this.timeoutMs = config.requestTimeoutMs;

    for (const target of config.targets) {
      this.state.set(target.name, {
        config: target,
        health: [],
        metrics: [],
        lastPoll: 0,
      });
    }
  }

  /** Start periodic polling */
  start(): void {
    if (this.timer) return;
    console.log(`[pinv-mon] Collector started — polling ${this.config.targets.length} targets every ${this.config.pollIntervalMs}ms`);
    
    // Initial poll
    this.pollAll();
    
    this.timer = setInterval(() => this.pollAll(), this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Get current state for all targets */
  getState(): Map<string, TargetState> {
    return this.state;
  }

  /** Get state for a specific target */
  getTargetState(name: string): TargetState | undefined {
    return this.state.get(name);
  }

  /** Poll all targets concurrently */
  async pollAll(): Promise<void> {
    const promises = Array.from(this.state.values()).map(target =>
      this.pollTarget(target).catch(err => {
        console.error(`[pinv-mon] Poll error for ${target.config.name}:`, err.message);
      })
    );
    await Promise.allSettled(promises);
  }

  /** Poll a single target */
  private async pollTarget(target: TargetState): Promise<void> {
    const now = Date.now();
    target.lastPoll = now;

    // 1. Health check
    const health = await this.checkHealth(target.config);
    target.health.push(health);
    if (target.health.length > this.historySize) {
      target.health.shift();
    }

    // 2. Metrics (if endpoint exists and health is up)
    if (target.config.metricsPath && health.status !== 'down') {
      const metrics = await this.fetchMetrics(target.config);
      target.metrics.push(metrics);
      if (target.metrics.length > this.historySize) {
        target.metrics.shift();
      }
    }
  }

  /** Check health endpoint */
  private async checkHealth(config: TargetConfig): Promise<HealthSnapshot> {
    const url = `${config.url}${config.healthPath}`;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const headers: Record<string, string> = { ...config.headers };
      if (config.authKey) {
        headers['Authorization'] = `Bearer ${config.authKey}`;
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - start;
      const statusCode = res.status;

      if (statusCode >= 200 && statusCode < 300) {
        return { timestamp: Date.now(), status: 'up', latencyMs, statusCode };
      } else if (statusCode === 503) {
        return { timestamp: Date.now(), status: 'degraded', latencyMs, statusCode };
      } else {
        return { timestamp: Date.now(), status: 'degraded', latencyMs, statusCode };
      }
    } catch (err: any) {
      return {
        timestamp: Date.now(),
        status: 'down',
        latencyMs: Date.now() - start,
        error: err.name === 'AbortError' ? 'timeout' : err.message,
      };
    }
  }

  /** Fetch and parse Prometheus metrics */
  private async fetchMetrics(config: TargetConfig): Promise<MetricsSnapshot> {
    const url = `${config.url}${config.metricsPath}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const headers: Record<string, string> = { ...config.headers };
      if (config.authKey) {
        headers['Authorization'] = `Bearer ${config.authKey}`;
      }

      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { timestamp: Date.now(), parsed: {} };
      }

      const raw = await res.text();
      const parsed = parsePrometheusText(raw);

      return { timestamp: Date.now(), raw, parsed };
    } catch {
      return { timestamp: Date.now(), parsed: {} };
    }
  }
}

/**
 * Parse Prometheus exposition format into flat key-value pairs.
 * Handles basic TYPE/HELP comments and metric lines.
 * Labels are flattened: `metric{label="value"}` → `metric{label="value"}`
 */
export function parsePrometheusText(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Match: metric_name{labels} value [timestamp]
    // or:   metric_name value [timestamp]
    const match = trimmed.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*(?:\{[^}]*\})?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
    if (match) {
      const key = match[1];
      const value = parseFloat(match[2]);
      if (!isNaN(value)) {
        result[key] = value;
      }
    }
  }

  return result;
}
