# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 146 commits, 4 packages (web/og/box/mon)
- **Live at**: pinv.app (Vercel), pinv-og.fly.dev (Fly.io), Phala TEE (box)
- pinv-mon: v0.2.0 — alerter, dashboard, live tests, 14/14 tests passing
- PMF: Strategy 1 (Crypto Dashboards) prioritized
- Code audit: 4/4 packages reviewed — open gaps below
- **Paused:** Feb 4-11 for magn.ee hackathon (Finalist!)
- **Resumed:** Feb 11 — back to PinV

## P0 Priorities (Security & Reliability)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Open SSRF proxy `/api/proxy` | **CRITICAL** | ✅ Fixed (`026b03c`) |
| 2 | Brittle `fetch` shim in Box (TEE crash) | **P0** | ✅ Fixed (`406f1b6`) |
| 3 | Token `uri()` no-op (Invisible NFTs) | **CRITICAL** | ✅ Fixed (`492e0a9`) |
| 4 | Host IP Concentration (429 risk) | **P0** | ✅ Fixed (`d82c251`) |
| 5 | Webhook Authentication Gap | **CRITICAL** | ✅ Fixed (`979a866`) |
| 6 | Client-side Snapshot Tampering | **CRITICAL** | ⚠️ Partial (server-side pinning done, CID origin unverified) |
| 7 | Verifiable Generation Gap (Puppet Master) | **CRITICAL** | ❌ Open (needs VIN / Task 8) |
| 8 | No global rate limiting on generation | HIGH | ⚠️ Local Fixed (`b58f23d`) |
| 9 | Secret Leakage in Box Logs | **HIGH** | ✅ Fixed (`58a7487`) |
| 10| Context Drift in Social Sharing | **HIGH** | ✅ Fixed (`018d8c1`) |
| 11| Creator Fee Entrapment | HIGH | ❌ Open |
| 12| Unverified Secret Provisioning | HIGH | ❌ Open |
| 13| Proof of Execution (Watermarking) | MEDIUM | ❌ Open |
| 14| Mock interceptor in prod IPFS code | **P1** | ✅ Fixed (`b022b77`) |
| 15| Test environment broken (146/193 fail) | **P1** | ❌ Open |

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
- [x] **Harden Snapshot Integrity:** Move IPFS pinning from client to `og/` server to prevent \"photoshopping\" gains in browser memory. (Fixed in `e6a3c9b`)

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

### Task 10: Fix Test Environment (NEW)
**Goal:** Get web/ tests passing to catch regressions.
**Acceptance criteria:**
- [ ] Add `forge build` step or pre-built artifacts for contract tests.
- [ ] Mock Redis in unit tests (or skip gracefully).
- [ ] Separate unit/integration/e2e test configs.
- [ ] Fix Vitest vs Bun test runner incompatibility (`vi.hoisted`).

### Task 11: Snapshot CID Origin Verification (NEW)
**Goal:** Prevent malicious clients from injecting arbitrary IPFS CIDs into bundles.
**Acceptance criteria:**
- [ ] OG service validates snapshot CID was pinned by our Pinata account.
- [ ] OR: Snapshot data is co-signed with bundle signature (server-side attestation).

## Key Decisions Needed from Egor
1. Switch widget generation from OpenRouter to VIN?
2. Upstash Redis for global rate limiting?
3. Priority: Fix tests (Task 10) vs VIN integration (Task 8)?
