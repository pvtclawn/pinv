# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 145 commits, 4 packages (web/og/box/mon)
- **Live at**: pinv.app (Vercel), pinv-og.fly.dev (Fly.io), Phala TEE (box)
- Contracts: Base Sepolia only, not mainnet
- pinv-mon: v0.2.0 — alerter, dashboard, live tests, 15 tests all passing
- PMF: Analyzed + Red-teamed
- Code audit: All 4 packages reviewed — 2 CRITICAL, 3 HIGH security findings
- Template Widgets: 3/3 built (Ticker, Portfolio, ENS)

## P0 Priorities (Security & Reliability)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Open SSRF proxy `/api/proxy` | **CRITICAL** | ✅ Fixed (`026b03c`) |
| 2 | Brittle `fetch` shim in Box (50% failure) | **P0** | ✅ Fixed (`406f1b6`) |
| 3 | Token `uri()` no-op (Marketplace Invisibility) | **CRITICAL** | ✅ Fixed (`492e0a9`) |
| 4 | Host IP Concentration (429 risk) | **P0** | ✅ Fixed (`d82c251`) |
| 5 | Webhook Authentication Gap | **CRITICAL** | ❌ Open |
| 6 | No rate limiting on `/api/generate` | HIGH | ⚠️ Local Fixed (`b58f23d`) |
| 7 | Secret Leakage in Box Logs | **HIGH** | ✅ Fixed (`58a7487`) |
| 8 | Context Drift in Social Sharing | **HIGH** | ❌ Open |
| 9 | Creator Fee Entrapment | HIGH | ❌ Open (Needs Recovery Logic) |
| 10| Widget code can exfiltrate via fetch | HIGH | ❌ Open (box arch) |
| 11| Notification Spam Risk | MEDIUM | ❌ Open |
| 12| Debug logging in prod | LOW | ✅ Fixed (`b58f23d`) |

Details: 
- `memory/challenges/2026-02-09--pinv-security-red-team.md`
- `memory/challenges/2026-02-09--box-runtime-failure-analysis.md`
- `memory/challenges/2026-02-10--infrastructure-scaling.md`
- `memory/challenges/2026-02-10--store-security.md`
- `memory/challenges/2026-02-10--rate-limit-and-contracts.md`
- `memory/challenges/2026-02-10--mini-app-interactivity.md`

## Completed Tasks

### ✅ Task 1: Code Audit
- All 4 packages reviewed, findings in `CODE_REVIEW.md`

### ✅ Task 2: Enhance pinv-mon
- Alerter, HTML dashboard, live integration test confirmed
- Box metrics scraping working (auth key configured)

### ✅ Task 3: Template Widgets
- 3 high-quality templates built and pushed: `6689aa4`, `e927310`, `2c48308`

### ✅ Task 4: Fix Initial Security/Contract P0s
- [x] Fix Token URI (Fetching from store with IPFS prefix)
- [x] Local Rate Limiting (In-memory map)
- [x] Disable Implementation Initializers
- [x] Excess Refund logic for minting

### ✅ Task 5: End-to-end Widget Testing
- [x] Submit template dataCode to live Box `/execute` (Verified via `/og/preview`)
- [x] Verify OG renders all 3 templates correctly (`6689aa4`, `e927310`, `2c48308`)
- [x] Add E2E integration test in `mon/` package (`src/e2e.test.ts`)
- Documented: TEE latency ~1.5s, no layout quirks found for Lucide/Inter fonts.

## Next Tasks

### Task 6: Secure Webhooks (BUILD LANE)
**Goal:** Implement Ed25519 verification for Farcaster Mini App events.
**Acceptance criteria:**
- [ ] Add cryptographic signature verification for `/api/webhook`.
- [ ] Reject any event not signed by a valid user app key.
- [ ] Document the security model.

### Task 7: Social Sharing Snapshots
**Goal:** Prevent context drift by creating immutable snapshots for shared widgets.
**Acceptance criteria:**
- [ ] Implement `Snapshot` schema for capturing dataCode output at share-time.
- [ ] Update `og/` engine to render from snapshot CID when provided.
- [ ] Verify social proof is preserved after price changes.

### Task 8: Advanced Hardening
**Goal:** Address secondary findings.
**Acceptance criteria:**
- [ ] Migrate rate limiting to Upstash Redis for global protection.
- [ ] Implement Notification Governor to prevent spam penalties.
- [ ] Research/Implement \"Creator Fund Recovery\" path.
- [ ] Add `timeout` to all `fetch` calls in template `dataCode.js`.

## Icebox (parked)
- Base App Mini App registration (blocked on mainnet deploy)
- Mainnet contract deployment (needs Egor decision)

## Key Decisions Needed from Egor
1. Approve the Fund Recovery design?
2. Upstash Redis for global rate limiting (needs API key)?
