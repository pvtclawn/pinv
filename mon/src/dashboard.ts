/**
 * pinv-mon — HTML Dashboard
 * 
 * Server-rendered HTML dashboard. No React, no build step.
 * Auto-refreshes every 30s.
 */

import type { SystemOverview, ServiceSummary } from './aggregator';

const STATUS_EMOJI: Record<string, string> = {
  up: '🟢',
  down: '🔴',
  degraded: '🟡',
  unknown: '⚪',
  healthy: '🟢',
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatUptime(pct: number): string {
  if (pct >= 99.9) return '99.9%+';
  return `${pct.toFixed(1)}%`;
}

function serviceCard(svc: ServiceSummary): string {
  const emoji = STATUS_EMOJI[svc.status] || '⚪';
  const uptimeColor = svc.uptime.percent >= 99 ? '#4ade80' : svc.uptime.percent >= 95 ? '#fbbf24' : '#f87171';

  const metricsRows = Object.entries(svc.keyMetrics).map(([k, v]) => {
    const shortKey = k.replace(/^box_/, '').replace(/\{[^}]*\}/, '');
    return `<tr><td style="color:#888;padding:2px 8px 2px 0">${escapeHtml(shortKey)}</td><td style="font-family:monospace">${typeof v === 'number' && v > 1000 ? v.toLocaleString() : v}</td></tr>`;
  }).join('');

  return `
    <div style="background:#1e1e2e;border:1px solid #333;border-radius:8px;padding:16px;min-width:280px;flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:20px">${emoji}</span>
        <div>
          <div style="font-weight:bold;font-size:16px">${escapeHtml(svc.name)}</div>
          <div style="color:#888;font-size:12px">${escapeHtml(svc.type)} · ${escapeHtml(svc.url)}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#11111b;padding:8px;border-radius:4px">
          <div style="color:#888;font-size:11px">Latency</div>
          <div style="font-size:18px;font-family:monospace">${formatMs(svc.latency.current)}</div>
          <div style="color:#666;font-size:10px">avg ${formatMs(svc.latency.avg)} · p95 ${formatMs(svc.latency.p95)}</div>
        </div>
        <div style="background:#11111b;padding:8px;border-radius:4px">
          <div style="color:#888;font-size:11px">Uptime</div>
          <div style="font-size:18px;font-family:monospace;color:${uptimeColor}">${formatUptime(svc.uptime.percent)}</div>
          <div style="color:#666;font-size:10px">${svc.uptime.upChecks}↑ ${svc.uptime.downChecks}↓ / ${svc.uptime.totalChecks}</div>
        </div>
      </div>
      ${metricsRows ? `<table style="font-size:12px;width:100%">${metricsRows}</table>` : ''}
    </div>`;
}

export function renderDashboard(overview: SystemOverview): string {
  const overallEmoji = STATUS_EMOJI[overview.overall] || '⚪';
  const time = new Date(overview.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const cards = overview.services.map(serviceCard).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="30">
  <title>pinv-mon dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #11111b; color: #cdd6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
    a { color: #89b4fa; }
  </style>
</head>
<body>
  <div style="max-width:960px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div>
        <h1 style="font-size:24px;font-weight:600">${overallEmoji} pinv-mon</h1>
        <div style="color:#888;font-size:12px">${time} · auto-refresh 30s</div>
      </div>
      <div style="display:flex;gap:8px">
        <a href="/" style="font-size:12px;padding:4px 8px;background:#1e1e2e;border-radius:4px;text-decoration:none">JSON</a>
        <a href="/metrics" style="font-size:12px;padding:4px 8px;background:#1e1e2e;border-radius:4px;text-decoration:none">Metrics</a>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:16px">
      ${cards}
    </div>
    ${overview.services.length === 0 ? '<div style="text-align:center;color:#666;padding:48px">No targets configured</div>' : ''}
  </div>
</body>
</html>`;
}
