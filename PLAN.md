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

## Next Task

### Task 3: PMF Experiment — Template Widgets
**Goal:** Build 3 high-quality widget templates to test Strategy 1 (Crypto Dashboards).
**Acceptance criteria:**
- [ ] Widget 1: ETH/BTC price ticker (live data, clean design)
- [ ] Widget 2: Wallet portfolio summary (top 5 tokens + total value)
- [ ] Widget 3: ENS profile card (avatar, name, records)
- [ ] Each widget works end-to-end: dataCode → box execution → OG render
- [ ] Egor tests on his Farcaster profile

**Blocked on:** Egor confirming which data APIs are available (CoinGecko key? Alchemy?)

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
