# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 145 commits, 4 packages (web/og/box/mon)
- **Live at**: pinv.app (Vercel), pinv-og.fly.dev (Fly.io), Phala TEE (box)
- pinv-mon: v0.2.0 — alerter, dashboard, live tests, 18 tests passing
- PMF: Strategy 1 (Crypto Dashboards) prioritized
- Code audit: 4/4 packages reviewed — 3 CRITICAL gaps identified

## P0 Priorities (Security & Reliability)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Open SSRF proxy `/api/proxy` | **CRITICAL** | ✅ Fixed (`026b03c`) |
| 2 | Brittle `fetch` shim in Box (TEE crash) | **P0** | ✅ Fixed (`406f1b6`) |
| 3 | Token `uri()` no-op (Invisible NFTs) | **CRITICAL** | ✅ Fixed (`492e0a9`) |
| 4 | Host IP Concentration (429 risk) | **P0** | ✅ Fixed (`d82c251`) |
| 5 | Webhook Authentication Gap | **CRITICAL** | ✅ Fixed (`979a866`) |
| 6 | Client-side Snapshot Tampering | **CRITICAL** | ❌ Open |
| 7 | Verifiable Generation Gap (Puppet Master) | **CRITICAL** | ❌ Open |
| 8 | No global rate limiting on generation | HIGH | ⚠️ Local Fixed (`b58f23d`) |
| 9 | Secret Leakage in Box Logs | **HIGH** | ✅ Fixed (`58a7487`) |
| 10| Context Drift in Social Sharing | **HIGH** | ✅ Fixed (`018d8c1`) |
| 11| Creator Fee Entrapment | HIGH | ❌ Open |
| 12| Unverified Secret Provisioning | HIGH | ❌ Open |
| 13| Proof of Execution (Watermarking) | MEDIUM | ❌ Open |

Details: `memory/challenges/*.md`

## Completed Tasks

### ✅ Task 1: Code Audit
- All 4 packages reviewed, findings in `CODE_REVIEW.md`

### ✅ Task 2: Enhance pinv-mon
- Alerter, HTML dashboard, live integration tests complete

### ✅ Task 3: Template Widgets
- 3 high-quality templates (Ticker, Portfolio, ENS) built and pushed

### ✅ Task 4: Fix Initial Security/Contract P0s
- uri(), refunds, disabled inits, local rate limiting

### ✅ Task 5: End-to-end Widget Testing
- Verified all 3 templates through live OG/Box pipeline

### ✅ Task 6: Secure Webhooks
- Cryptographic verification of JFS payloads in `/api/webhook`

## Next Tasks

### ✅ Task 7: Social Sharing Snapshots
- [x] Implement `Snapshot` schema for capturing dataCode output at share-time. (Fixed in `018d8c1`)
- [x] Update `og/` engine to render from snapshot CID when provided. (Fixed in `018d8c1`)
- [x] Verify social proof is preserved after price changes.
- [ ] **Harden Snapshot Integrity:** Move IPFS pinning from client to `og/` server to prevent "photoshopping" gains in browser memory. (CRITICAL)

### Task 8: Verifiable Stack — VIN Integration (BUILD LANE)
**Goal:** Replace trusted OpenRouter calls with verifiable VIN inference.
**Acceptance criteria:**
- [ ] Audit `web/` to ensure secrets are encrypted client-side.
- [ ] Implement VIN client in `web/` for code generation.
- [ ] Store VIN receipt on-chain/IPFS for verification.

### Task 9: Advanced Hardening
- [ ] Global rate limiting (Upstash Redis).
- [ ] PNG watermarking with TEE execution ID.
- [ ] Creator Fund Recovery path.

## Key Decisions Needed from Egor
1. Switch widget generation from OpenRouter to VIN?
2. Upstash Redis for global rate limiting?
