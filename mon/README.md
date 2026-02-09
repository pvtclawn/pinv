# pinv-mon

Unified monitoring service for PinV instances — **web**, **og**, and **box**.

## What It Does

- **Health checks**: Polls each service's health endpoint at configurable intervals
- **Metrics scraping**: Collects Prometheus metrics from box (and any service that exposes them)
- **Aggregation**: Computes uptime %, latency percentiles (avg/p95/min/max), and overall system health
- **Dashboard API**: JSON endpoints for integration with external dashboards or alerting
- **Self-metrics**: Exposes its own Prometheus metrics at `/metrics`

## Quick Start

```bash
# Monitor all three services
PINV_WEB_URL=https://pinv.app \
PINV_OG_URL=https://pinv-og.fly.dev \
PINV_BOX_URL=https://box.phala.cloud \
PINV_BOX_AUTH_KEY=your-internal-key \
bun run dev
```

Dashboard available at `http://localhost:6666`.

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PINV_MON_PORT` | `6666` | Dashboard port |
| `PINV_MON_POLL_MS` | `30000` | Poll interval (ms) |
| `PINV_MON_TIMEOUT_MS` | `10000` | Request timeout per target |
| `PINV_MON_HISTORY_SIZE` | `100` | Snapshots retained per target |
| `PINV_WEB_URL` | — | Web service base URL |
| `PINV_OG_URL` | — | OG service base URL |
| `PINV_BOX_URL` | — | Box service base URL |
| `PINV_BOX_AUTH_KEY` | — | Bearer token for box /metrics |
| `PINV_MON_TARGETS` | — | Full JSON target config (advanced) |

### Advanced Target Config

```bash
PINV_MON_TARGETS='[
  {"name":"og-prod","type":"og","url":"https://pinv-og.fly.dev","healthPath":"/healthz"},
  {"name":"og-staging","type":"og","url":"https://pinv-og-staging.fly.dev","healthPath":"/healthz"},
  {"name":"box-phala","type":"box","url":"https://box.example.com","healthPath":"/healthz","metricsPath":"/metrics","authKey":"secret"}
]'
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Full system overview (overall status + all services) |
| `GET /healthz` | pinv-mon own health |
| `GET /services` | All service summaries |
| `GET /services/:name` | Single service detail with history |
| `GET /metrics` | Prometheus metrics (pinv-mon self) |

### Example Response: `GET /`

```json
{
  "timestamp": 1707500000000,
  "overall": "healthy",
  "services": [
    {
      "name": "og",
      "type": "og",
      "status": "up",
      "url": "https://pinv-og.fly.dev",
      "latency": { "current": 120, "avg": 135, "p95": 200, "min": 80, "max": 350 },
      "uptime": { "percent": 99.5, "totalChecks": 200, "upChecks": 199, "downChecks": 1, "degradedChecks": 0 },
      "lastCheck": 1707500000000,
      "keyMetrics": {}
    },
    {
      "name": "box",
      "type": "box",
      "status": "up",
      "latency": { "current": 95, "avg": 110, "p95": 180, "min": 60, "max": 280 },
      "uptime": { "percent": 100, "totalChecks": 200, "upChecks": 200, "downChecks": 0, "degradedChecks": 0 },
      "keyMetrics": {
        "box_executions_total{status=\"success\",code=\"200\"}": 1523,
        "box_active_isolates": 2,
        "box_pool_size": 4,
        "box_process_resident_memory_bytes": 125000000
      }
    }
  ]
}
```

## Tests

```bash
bun test
```

## Architecture

```
pinv-mon
├── src/
│   ├── index.ts        # Entry point
│   ├── config.ts       # Configuration loading
│   ├── collector.ts    # Health checks + metrics scraping
│   ├── aggregator.ts   # Derived metrics + summaries
│   ├── server.ts       # Hono HTTP API
│   └── collector.test.ts
```

The collector polls targets independently and stores bounded time-series data.
The aggregator computes derived stats on-demand when API endpoints are hit.
