# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 145 commits, 4 packages (web/og/box/mon)
- **Live at**: pinv.app (Vercel), pinv-og.fly.dev (Fly.io), Phala TEE (box)
- Contracts: Base Sepolia only, not mainnet
- pinv-mon: v0.2.0 — alerter, dashboard, live tests, 14 tests all passing
- PMF: Analyzed + Red-teamed
- Code audit: OG/box/contracts/lib/web reviewed — 1 CRITICAL, 2 HIGH findings

## Security (URGENT — before promoting)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Open SSRF proxy `/api/proxy` | **CRITICAL** | ❌ Open |
| 2 | No rate limiting on `/api/generate` | HIGH | ❌ Open |
| 3 | Widget code can exfiltrate via fetch | HIGH | ❌ Open (box arch) |
| 4 | Debug logging in prod | LOW | ❌ Open |

Details: `memory/challenges/2026-02-09--pinv-security-red-team.md`

## Completed Tasks

### ✅ Task 1: Code Audit
- All 4 packages reviewed, findings in `CODE_REVIEW.md`
- Key issues: dup generator logic (OG), SSRF proxy (web), no API auth
- OG SWR + box pool both production-quality

### ✅ Task 2: Enhance pinv-mon
- Alerter (consecutive down detection, latency thresholds, webhook support)
- HTML dashboard at `/dashboard`
- Live integration test — all 3 services confirmed healthy
- Box metrics scraping working (auth key configured)

## Completed Tasks (cont.)

### ✅ Task 3: PMF Experiment — Template Widgets
- [x] Widget 1: Crypto Price Ticker (CoinGecko, dark gradient, dual cards) — `6689aa4`
- [x] Widget 2: Wallet Portfolio (Base RPC + CoinGecko, allocation bars) — `e927310`
- [x] Widget 3: ENS Profile Card (enstate.rs, avatar, records list) — `2c48308`
- All use free public APIs (no keys needed)
- [ ] Egor tests on Farcaster profile (needs deploy)

## Next Tasks

### Task 4: End-to-end Widget Testing
**Goal:** Test template widgets through the live PinV pipeline (box exec → OG render).
**Acceptance criteria:**
- [ ] Submit crypto-ticker dataCode to live box /execute endpoint
- [ ] Verify OG renders the widget correctly
- [ ] Document any rendering issues (Satori quirks, missing fonts)

### Task 5: Fix Security Issues
**Goal:** Address CRITICAL/HIGH findings before promoting PinV.
**Acceptance criteria:**
- [ ] Add URL allowlist to /api/proxy (SSRF fix)
- [ ] Add basic rate limiting to /api/generate
- [ ] PR to upstream or discuss with Egor

## Icebox (parked)
- Fix SSRF proxy (waiting for Egor's go-ahead to PR upstream)
- Base App Mini App registration (blocked on mainnet deploy)
- Mainnet contract deployment (needs Egor decision)
- AI generation improvements (needs PMF signal first)
- Secondary market / trading features (premature)

## Key Decisions Needed from Egor
1. Fix the SSRF proxy? (PR to upstream, or leave for now?)
2. Deploy contracts to Base mainnet?
3. Which data APIs for template widgets? (CoinGecko, Alchemy, etc.)
