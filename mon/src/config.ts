/**
 * pinv-mon — Configuration
 * 
 * Defines the monitoring targets (web, og, box instances)
 * and polling intervals.
 */

export interface TargetConfig {
  name: string;
  type: 'web' | 'og' | 'box';
  url: string;
  /** Health check endpoint path */
  healthPath: string;
  /** Metrics endpoint path (Prometheus format, if available) */
  metricsPath?: string;
  /** Auth key for protected endpoints */
  authKey?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface MonConfig {
  /** Port for the monitoring dashboard */
  port: number;
  /** Poll interval in ms */
  pollIntervalMs: number;
  /** Request timeout per target in ms */
  requestTimeoutMs: number;
  /** Targets to monitor */
  targets: TargetConfig[];
  /** How many historical snapshots to retain per target */
  historySize: number;
}

function parseTargets(): TargetConfig[] {
  const targets: TargetConfig[] = [];

  // Parse from PINV_MON_TARGETS env (JSON array) or individual env vars
  const targetsJson = process.env.PINV_MON_TARGETS;
  if (targetsJson) {
    try {
      const parsed = JSON.parse(targetsJson) as TargetConfig[];
      targets.push(...parsed);
    } catch {
      console.error('[pinv-mon] Failed to parse PINV_MON_TARGETS JSON');
    }
  }

  // Convenience env vars for common setup
  const webUrl = process.env.PINV_WEB_URL;
  const ogUrl = process.env.PINV_OG_URL;
  const boxUrl = process.env.PINV_BOX_URL;
  const boxAuthKey = process.env.PINV_BOX_AUTH_KEY;

  if (webUrl && !targets.some(t => t.type === 'web')) {
    targets.push({
      name: 'web',
      type: 'web',
      url: webUrl,
      healthPath: '/', // Next.js has no dedicated health endpoint; check homepage
    });
  }

  if (ogUrl && !targets.some(t => t.type === 'og')) {
    targets.push({
      name: 'og',
      type: 'og',
      url: ogUrl,
      healthPath: '/healthz',
    });
  }

  if (boxUrl && !targets.some(t => t.type === 'box')) {
    targets.push({
      name: 'box',
      type: 'box',
      url: boxUrl,
      healthPath: '/healthz',
      metricsPath: '/metrics',
      authKey: boxAuthKey,
    });
  }

  return targets;
}

export function loadConfig(): MonConfig {
  return {
    port: parseInt(process.env.PINV_MON_PORT || '6666', 10),
    pollIntervalMs: parseInt(process.env.PINV_MON_POLL_MS || '30000', 10),
    requestTimeoutMs: parseInt(process.env.PINV_MON_TIMEOUT_MS || '10000', 10),
    targets: parseTargets(),
    historySize: parseInt(process.env.PINV_MON_HISTORY_SIZE || '100', 10),
  };
}
