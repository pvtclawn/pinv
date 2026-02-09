# PinV — Plan (Feb 2026)

## Current State
- Codebase: 15k LOC, 145 commits, 4 packages (web/og/box/mon)
- Contracts: Base Sepolia only, not mainnet
- pinv-mon: v0.1.0 shipped, 9 tests
- PMF: Analyzed (PMF_ANALYSIS.md) + Red-teamed (challenges/2026-02-09--pinv-pmf-red-team.md)

## Next 3 Tasks (priority order)

### Task 1: Deep Code Audit (THIS WEEK)
**Goal:** Understand every file, identify bugs, tech debt, and improvement areas.
**Acceptance criteria:**
- [ ] Read and annotate all source files across web/, og/, box/, lib/, contracts/
- [ ] Document findings in `CODE_REVIEW.md` (bugs, tech debt, quick wins)
- [ ] Run existing tests, fix any failures
- [ ] Identify missing test coverage

### Task 2: Enhance pinv-mon (THIS WEEK)
**Goal:** Make pinv-mon production-useful for monitoring live instances.
**Acceptance criteria:**
- [ ] Add alerting (configurable thresholds → webhook/log alerts)
- [ ] Add HTML dashboard endpoint (simple, no React — just server-rendered HTML)
- [ ] Scrape OG concurrency metrics (activeRequests from og/api/server.ts)
- [ ] Add integration test with mock HTTP server

### Task 3: PMF Experiment — Template Widgets (NEXT WEEK)
**Goal:** Build 3 high-quality widget templates to test Strategy 1 (Crypto Dashboards).
**Acceptance criteria:**
- [ ] Widget 1: ETH/BTC price ticker (live data, clean design)
- [ ] Widget 2: Wallet portfolio summary (top 5 tokens + total value)
- [ ] Widget 3: ENS profile card (avatar, name, records)
- [ ] Each widget works end-to-end: dataCode → box execution → OG render
- [ ] Egor tests on his Farcaster profile

## Icebox (parked)
- Base App Mini App registration (blocked on mainnet deploy)
- Mainnet contract deployment (needs Egor decision on timing)
- AI widget generation improvements (needs PMF signal first)
- Secondary market / trading features (premature)

## Key Decisions Needed from Egor
1. Deploy contracts to Base mainnet? (vs. staying on Sepolia for now)
2. Which live data sources should template widgets target?
3. OG/Box deployment credentials for pinv-mon to monitor real instances?
