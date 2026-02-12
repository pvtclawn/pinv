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
| 6 | Client-side Snapshot Tampering | **CRITICAL** | ✅ Fixed (`1899b06` — CID origin verification via Pinata) |
| 7 | Verifiable Generation Gap (Puppet Master) | **CRITICAL** | ❌ Open (needs VIN / Task 8) |
| 8 | No global rate limiting on generation | HIGH | ✅ Fixed (`aaff5b5` — global 200/day + LRU cleanup) |
| 9 | Secret Leakage in Box Logs | **HIGH** | ✅ Fixed (`58a7487`) |
| 10| Context Drift in Social Sharing | **HIGH** | ✅ Fixed (`018d8c1`) |
| 11| Creator Fee Entrapment | HIGH | ❌ Open |
| 12| Unverified Secret Provisioning | HIGH | ❌ Open |
| 13| Proof of Execution (Watermarking) | MEDIUM | ✅ Fixed (`06708f2`) |
| 14| Mock interceptor in prod IPFS code | **P1** | ✅ Fixed (`b022b77`) |
| 15| Test environment broken (146/193 fail) | **P1** | ✅ Fixed (scoped test paths, vitest compat) |

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
- [x] Global rate limiting — daily budget (200/day) + per-IP (5/min) + LRU cleanup (`aaff5b5`).
- [ ] PNG watermarking with TEE execution ID.
- [ ] Creator Fund Recovery path.

### Task 10: Fix Test Environment ~~(NEW)~~
**Goal:** Get web/ tests passing to catch regressions.
**Status:** ✅ Already passing — 1 pass, 1 skip (needs PRIVATE_KEY), 1 skip (needs local server).
**Note:** Original 146/193 failures were from `bun test` picking up OZ Hardhat tests in `contracts/lib/`. Fixed by scoping test paths in root `package.json`.
- [x] ~~Add `forge build` step or pre-built artifacts for contract tests.~~ Not needed — vitest scoped correctly.
- [x] ~~Mock Redis in unit tests (or skip gracefully).~~ No Redis dependency in web/ tests.
- [x] ~~Separate unit/integration/e2e test configs.~~ Already separated via vitest config.
- [x] ~~Fix Vitest vs Bun test runner incompatibility (`vi.hoisted`).~~ Fixed by renaming to `.vitest.ts`.

### ✅ Task 11: Snapshot CID Origin Verification
- [x] OG service validates snapshot CID was pinned by our Pinata account.
- [x] Fails closed in production, falls back to live execution on failure.
- [x] Bounded LRU cache (500 entries, 1h TTL) for verification results.
- Commit: `1899b06`

### ✅ Task 12: OG Performance Optimization
**Goal:** Optimize widget serving without sacrificing dynamic data freshness.
**Status:** ✅ Complete (`fdeef72`)
- [x] Pin cache TTL 5s → 5min (eliminates ~90% RPC calls)
- [x] CDN cache headers 60s → 1hr for static widgets
- [x] Box fetch 10s timeout (prevents hanging requests)
- [x] Box env migrated to validated schema
- [x] Worker pool pre-warm on startup
- [x] IPFS gateways updated (replaced stale cloudflare-ipfs)
- [x] Production log gating (verbose box logs dev-only)
- [x] Emoji detection: eliminated double-render
- [x] **Merged to main** (`fdeef72`)

### ✅ Task 13: Quick Security Hardening (from Feb 12 red-team)
**Goal:** Close trivially-exploitable gaps found in Lane F challenge.
**Status:** ✅ Complete (`8c97373`)
- [x] **W1**: Replace `x-forwarded-for` with `x-real-ip` in rate limiter (prevents IP spoofing bypass)
- [x] **W3**: Make `PINATA_JWT` required when `NODE_ENV=production` in og env schema

**Details:** `memory/challenges/2026-02-12--open-attack-surface.md`

### ✅ Task 14: OG Infrastructure Hardening
**Goal:** Address weaknesses found during OG red-team review.
**Status:** ✅ Complete (`51654c9`)
- [x] **Size Guard**: Implement strict size limits (100KB) for `uiCode` and `previewData`. (Fixed in `fb32999`)
- [x] **Cache Tuning**: Reduced `CACHE_TTL` to 60s for better responsiveness. (Fixed in `fb32999`)
- [x] **Worker Recycling**: Implemented "Max Requests" (100) limit for worker pool. (Fixed in `51654c9`)

### ✅ Task 15: TEE-Signed Images (Watermarking)
**Goal:** Prove the final PNG was produced by the TEE, preventing visual spoofing.
**Status:** ✅ Complete (`06708f2`)
- [x] Implement cryptographic proof injection into PNG `tEXt` chunks. (Fixed in `8cdfdde`)
- [x] Expose `/verify` endpoint to validate image authenticity. (Fixed in `8cdfdde`)
- [x] **Task 15.1 (P0)**: Visual watermarking wrapper to survive metadata stripping on social platforms. (Fixed in `06708f2`)
- [x] **Task 15.2 (P1)**: Include `uiCode` hash in the execution proof to prevent rendering logic swaps. (Fixed in `06708f2`)

### Task 16: MPC-Based Sovereign Custody Prototype
**Goal:** Implement (2, 3) Threshold Signature scheme for creator fund management.
**Acceptance criteria:**
- [ ] Prototype (2, 3) FROST-based signing handshake.
- [ ] Implement shard separation between User Browser, PinV Backend, and Guardian Service.
- [x] **Task 16.1 (P0)**: Define a decentralized \"Sovereign Recovery\" model (no PinV backups). (Critique in `memory/challenges/2026-02-12--threshold-custody.md`)

### ✅ Task 17: Social Proof Alignment
**Goal:** Align infrastructure with the core "Dynamic Social Widget" vision.
**Status:** ✅ Complete (`1853bca0`)
- [x] **P0**: Standardize "Social Proof" indicators on widgets. (Proves image data matches on-chain code).
- [x] **P1**: Implement version-drift detection to ensure shared images reflect the latest data/logic.

### Task 19: Dynamic Vision Hardening (NEW — from #879 red-team)
**Goal:** Address caching, timeout, and centralization risks in the dynamic widget vision.
**Acceptance criteria:**
- [ ] **P0**: Pre-render images at mint time and cache CID on-chain/IPFS to prevent crawler unfurl timeouts.
- [ ] **P1**: Add "Last Updated" relative timestamps to high-velocity templates (DEX Pairs).
- [ ] **P2**: Implement data fallbacks (e.g., Uniswap subgraph) in `dex-pairs.json` to handle primary API failures.

### Task 20: Widget Generation Perfection (NEW — branch `gen-feedback-research`)
**Goal:** Implement RLHF-style feedback loops to improve widget generation.
**Acceptance criteria:**
- [x] **Data Collection**: Add a 1-5 star rating component to the widget editor preview. (Fixed in `ef6bf37`)
- [x] **Feedback API**: Create an endpoint to store `prompt -> result + score` pairs. (Fixed in `ef6bf37`)
- [x] **New Package**: Initialize `pinv-gen` to house system prompts and evaluation logic. (Fixed in `ef6bf37`)
- [x] **Benchmark Suite**: Create a script in `pinv-gen` to run the dataset against prompt variants. (Fixed in `81fb0f3`)
- [x] **Implicit Signal Tracking (P0)**: Automatically track widget \"Saves\" (Score 5) and \"Manual Edits\" (Score 3) as high-volume feedback. (Fixed in `7526a37`)
- [x] **Compiler Validation (P0)**: Integrate code-quality checks into the benchmark suite to distinguish between \"Vibes\" and \"Functionality.\" (Fixed in `7526a37`)
- [ ] **Prompt Iteration**: Refine `GENERATION_SYSTEM_PROMPT` using benchmark results.

### Task 21: Gateway Infrastructure Hardening (NEW — from #889 red-team)
**Goal:** Address bridge fragility, registry volatility, and context poisoning.
**Acceptance criteria:**
- [ ] **P0**: Implement a 100KB size guard for all tool outputs in the OpenClaw routing layer to prevent session poisoning.
- [ ] **P0**: Configure a "Stable Fallback" model provider (e.g., direct Anthropic API) to bypass experimental bridges during failures.
- [ ] **P1**: Implement a registry health check to validate model IDs before attempting a turn.

## Next Steps (prioritized, Feb 12)

1. **Task 20** (Generation Research) — Branch `gen-feedback-research`. (CURRENT FOCUS)
2. **Task 19** (Dynamic Vision Hardening) — Pre-rendering and timestamps.
3. **Task 16** (MPC Prototype) — Research physical infrastructure separation.

## Key Decisions Needed from Egor
1. ~~Switch widget generation from OpenRouter to VIN?~~ **Deprioritized** (Feb 11)
2. Upstash Redis for persistent rate limiting? (cold starts reset in-memory state)
3. Ship magn.ee as a real product? (Egor considering after 2nd place finish)
4. Is PinV a product or a portfolio piece? Determines next investment level.
