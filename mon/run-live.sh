#!/bin/bash
# pinv-mon — Run against live PinV instances
# Usage: ./run-live.sh

export PINV_WEB_URL="https://www.pinv.app"
export PINV_OG_URL="https://pinv-og.fly.dev"
export PINV_BOX_URL="https://abc63ee90f991a2b0932b94a94dd84c4048156b2-8080.dstack-pha-prod9.phala.network"
export PINV_BOX_AUTH_KEY="$(python3 -c "import json; print(json.load(open('../../.vault/secrets.json'))['PINV_BOX_AUTH_KEY'])" 2>/dev/null)"
export PINV_MON_PORT=6666
export PINV_MON_POLL_MS=30000

exec bun src/index.ts
