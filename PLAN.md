# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 145 commits, 4 packages (web/og/box/mon)
- **Live at**: pinv.app (Vercel), pinv-og.fly.dev (Fly.io), Phala TEE (box)
- Contracts: Base Sepolia only, not mainnet
- pinv-mon: v0.2.0 — alerter, dashboard, live tests, 14 tests all passing
- PMF: Analyzed + Red-teamed
- Code audit: All 4 packages reviewed — 1 CRITICAL, 2 HIGH security findings
- Template Widgets: 3/3 built (Ticker, Portfolio, ENS)

## P0 Priorities (Security & Reliability)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Open SSRF proxy `/api/proxy` | **CRITICAL** | ✅ Fixed (`026b03c`) |
| 2 | Brittle `fetch` shim in Box (50% failure) | **P0** | ❌ Open |
| 3 | No rate limiting on `/api/generate` | HIGH | ❌ Open |
| 4 | Widget code can exfiltrate via fetch | HIGH | ❌ Open (box arch) |
| 5 | Debug logging in prod | LOW | ❌ Open |

Details: 
- `memory/challenges/2026-02-09--pinv-security-red-team.md`
- `memory/challenges/2026-02-09--box-runtime-failure-analysis.md`

## Completed Tasks

### ✅ Task 1: Code Audit
- All 4 packages reviewed, findings in `CODE_REVIEW.md`
- Key issues: dup generator logic (OG), SSRF proxy (web), no API auth

### ✅ Task 2: Enhance pinv-mon
- Alerter, HTML dashboard, live integration test confirmed
- Box metrics scraping working (auth key configured)

### ✅ Task 3: Template Widgets
- 3 high-quality templates built and pushed: `6689aa4`, `e927310`, `2c48308`

## Next Tasks

### Task 4: Fix P0s (BUILD LANE)
**Goal:** Address CRITICAL security and reliability findings immediately.
**Acceptance criteria:**
- [x] Add URL allowlist to `/api/proxy` (Fixed in `026b03c`)
- [ ] **Harden `fetch` shim** in `box/src/sandbox/bootstrap.ts` (Safe JSON parsing)
- [ ] Implement IP-based rate limiting on `/api/generate`
- [ ] Remove debug logs in `api/generate/route.ts`

### Task 5: End-to-end Widget Testing
**Goal:** Test template widgets through the live PinV pipeline.
**Acceptance criteria:**
- [ ] Submit crypto-ticker dataCode to live box /execute
- [ ] Verify OG renders the widget correctly
- [ ] Document rendering quirks

### Task 6: Widget Hardening
**Goal:** Improve reliability of template widgets.
**Acceptance criteria:**
- [ ] Add `timeout` to all `fetch` calls in template `dataCode.js`
- [ ] Implement standard error fallback image in UI code

## Icebox (parked)
- Base App Mini App registration (blocked on mainnet deploy)
- Mainnet contract deployment (needs Egor decision)
- Secondary market features (premature)

## Key Decisions Needed from Egor
1. Approve the URL allowlist for the proxy? (Implemented, awaiting review)
2. Mainnet deploy timing?
