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
| 3 | Token `uri()` no-op (Marketplace Invisibility) | **CRITICAL** | ❌ Open |
| 4 | Host IP Concentration (429 risk) | **P0** | ✅ Fixed (`d82c251`) |
| 5 | No rate limiting on `/api/generate` | HIGH | ❌ Open |
| 6 | Secret Leakage in Box Logs | **HIGH** | ✅ Fixed (`58a7487`) |
| 7 | Creator Fee Entrapment | HIGH | ❌ Open |
| 8 | Widget code can exfiltrate via fetch | HIGH | ❌ Open (box arch) |
| 9 | Debug logging in prod | LOW | ✅ Fixed (`b58f23d`) |

Details: 
- `memory/challenges/2026-02-09--pinv-security-red-team.md`
- `memory/challenges/2026-02-09--box-runtime-failure-analysis.md`
- `memory/challenges/2026-02-10--infrastructure-scaling.md`
- `memory/challenges/2026-02-10--store-security.md`

## Completed Tasks

### ✅ Task 1: Code Audit
- All 4 packages reviewed, findings in `CODE_REVIEW.md`

### ✅ Task 2: Enhance pinv-mon
- Alerter, HTML dashboard, live integration test confirmed
- Box metrics scraping working (auth key configured)

### ✅ Task 3: Template Widgets
- 3 high-quality templates built and pushed: `6689aa4`, `e927310`, `2c48308`

## Next Tasks

### Task 4: Fix Remaining Security/Contract P0s (BUILD LANE)
**Goal:** Address CRITICAL marketplace and rate-limiting gaps.
**Acceptance criteria:**
- [x] **Fix Token URI:** Implement `uri()` logic in `PinV.sol` to fetch from store. (Fixed in `e84a22c`)
- [x] **Rate Limiting:** Implement IP-based rate limiting on `/api/generate`. (Fixed in `b58f23d`)
- [x] **Disable Implementation:** Add `_disableInitializers()` to `PinVStore` implementation. (Fixed in `e84a22c`)
- [x] **Excess Refund:** Ensure `secondaryMint` refunds excess ETH. (Fixed in `e84a22c`)

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

## Key Decisions Needed from Egor
1. Approve the Contract fixes (URI, refund, disable init)?
2. Mainnet deploy timing?
