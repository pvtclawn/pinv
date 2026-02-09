/**
 * pinv-mon — Alerting
 * 
 * Fires alerts when services go down or exceed latency thresholds.
 * Alerts are logged and optionally sent to a webhook.
 */

import type { ServiceSummary } from './aggregator';

export interface AlertConfig {
  /** Max latency before warning (ms) */
  latencyWarnMs: number;
  /** Max latency before critical (ms) */
  latencyCritMs: number;
  /** Consecutive downs before alerting */
  downThreshold: number;
  /** Webhook URL for alerts (optional) */
  webhookUrl?: string;
}

export interface Alert {
  timestamp: number;
  level: 'warn' | 'critical';
  service: string;
  message: string;
}

export class Alerter {
  private config: AlertConfig;
  private downCounts: Map<string, number> = new Map();
  private alerts: Alert[] = [];
  private readonly maxAlerts = 100;

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      latencyWarnMs: config?.latencyWarnMs ?? 2000,
      latencyCritMs: config?.latencyCritMs ?? 5000,
      downThreshold: config?.downThreshold ?? 2,
      webhookUrl: config?.webhookUrl,
    };
  }

  /** Evaluate services and fire alerts */
  async evaluate(services: ServiceSummary[]): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const svc of services) {
      // Track consecutive downs
      if (svc.status === 'down') {
        const count = (this.downCounts.get(svc.name) ?? 0) + 1;
        this.downCounts.set(svc.name, count);

        if (count >= this.config.downThreshold) {
          newAlerts.push({
            timestamp: Date.now(),
            level: 'critical',
            service: svc.name,
            message: `${svc.name} is DOWN (${count} consecutive failures)`,
          });
        }
      } else {
        this.downCounts.set(svc.name, 0);
      }

      // Latency alerts (only for up services)
      if (svc.status === 'up') {
        if (svc.latency.current > this.config.latencyCritMs) {
          newAlerts.push({
            timestamp: Date.now(),
            level: 'critical',
            service: svc.name,
            message: `${svc.name} latency critical: ${Math.round(svc.latency.current)}ms (threshold: ${this.config.latencyCritMs}ms)`,
          });
        } else if (svc.latency.current > this.config.latencyWarnMs) {
          newAlerts.push({
            timestamp: Date.now(),
            level: 'warn',
            service: svc.name,
            message: `${svc.name} latency warning: ${Math.round(svc.latency.current)}ms (threshold: ${this.config.latencyWarnMs}ms)`,
          });
        }
      }
    }

    // Store alerts (bounded)
    for (const alert of newAlerts) {
      console.log(`[ALERT:${alert.level}] ${alert.message}`);
      this.alerts.push(alert);
    }
    while (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    // Send to webhook if configured
    if (newAlerts.length > 0 && this.config.webhookUrl) {
      await this.sendWebhook(newAlerts).catch(err => {
        console.error('[pinv-mon] Webhook delivery failed:', err.message);
      });
    }

    return newAlerts;
  }

  /** Get recent alerts */
  getAlerts(limit = 20): Alert[] {
    return this.alerts.slice(-limit);
  }

  private async sendWebhook(alerts: Alert[]): Promise<void> {
    if (!this.config.webhookUrl) return;
    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alerts }),
    });
  }
}
