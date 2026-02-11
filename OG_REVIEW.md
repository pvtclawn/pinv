# PinV OG Package — Performance & Architecture Review

**Date:** 2026-02-12
**Scope:** `og/` package — 25 files, 2008 LOC
**Focus:** Widget serving optimality, bottlenecks, improvements

---

## Architecture Summary

```
Request → server.ts (concurrency limiter)
       → controllers.ts (route handlers)
       → auth.ts (bundle/sig verification)
       → keygen.ts (cache key)
       → swr.ts (stale-while-revalidate cache layer)
       → generator.ts (orchestrator)
           → pin.ts (on-chain data fetch via viem)
           → ipfs.ts (IPFS gateway race)
           → box.ts (TEE code execution)
           → renderer.ts → pool.ts → worker.ts (Satori + Resvg)
       → cache.ts (Redis L2 + LRU L1)
```

## What's Working Well ✅

1. **SWR pattern** — Proper stale-while-revalidate with background refresh. Users get instant cached responses while data updates in background.
2. **Worker pool** — Bun Worker threads with timeout guards prevent renderer from blocking the event loop.
3. **Concurrency limiter** — MAX_CONCURRENT=10 with 503 fast-fail protects memory.
4. **Multi-layer cache** — L1 memory (LRU, 5min) → L2 Redis (7 days) with read-through optimization.
5. **IPFS gateway race** — Priority gateway + staggered public gateway fallback is smart.
6. **Graceful Redis degradation** — Falls back to memory cache when Redis is down.

## Issues Found 🔴

### P0 — Critical Performance

#### 1. Pin Cache TTL is 5 SECONDS (`pin.ts:19`)
```typescript
const CACHE_TTL = 5 * 1000;
```
On-chain data (title, tagline, IPFS CID) changes **extremely rarely** — only when owner updates the widget. A 5-second cache means every request after 5s triggers 3-4 RPC calls + IPFS fetch. This is the **single biggest bottleneck**.

**Fix:** Increase to 5-10 minutes minimum. Widget updates are rare; use SWR pattern for pin data too, or cache-bust on version change.

#### 2. Sequential RPC calls in `pin.ts` for versioned pins
```typescript
if (version) {
    targetVer = version;
    [title, tagline] = await Promise.all([...]);
}
```
When `version` is specified, `latestVersion` isn't fetched (good), but the `storeAddress` fetch is always sequential before the batch. Could batch all 4 calls.

**Fix:** Use `multicall` or batch the store address fetch with data fetches where possible.

#### 3. No CDN/Edge caching headers for static widgets
Response headers set `Cache-Control: public, max-age=60` for non-bundle requests. Social crawlers (Twitter, Discord, Telegram) respect these headers. 60 seconds is way too short for static widget images that rarely change.

**Fix:** For non-bundle (default) renders: `max-age=3600, stale-while-revalidate=86400`. Let CDN/browser cache do the heavy lifting. Bundle renders can stay at 60s.

### P1 — High Impact

#### 4. `box.ts` uses `process.env` directly instead of `env.ts`
```typescript
const BOX_URL = process.env.BOX_URL || "http://localhost:8080";
const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;
```
Inconsistent with the rest of the codebase which uses the validated `env` object. No runtime validation on BOX_URL format.

**Fix:** Add BOX_URL to `env.ts` schema, import from there.

#### 5. Worker pool doesn't pre-warm workers
Workers are created on-demand. First request to a cold instance pays worker creation + module loading cost (Satori, Resvg, React, fonts).

**Fix:** Pre-spawn at least 1 worker on startup. Add a `warmUp()` method to `BunWorkerPool`.

#### 6. Font loading happens on EVERY render (`worker.ts:76-78`)
```typescript
const dynamicFonts = await loadDynamicFonts(sandbox.scope.exports.config || {});
const coreFonts = getCoreFonts();
```
Core fonts are read from disk on every render. `getCoreFonts()` likely calls `fs.readFileSync` each time.

**Fix:** Load core fonts ONCE at worker startup, cache in module scope.

#### 7. `renderToStaticMarkup` for emoji detection is expensive
```typescript
const htmlString = renderToStaticMarkup(element);
graphemeImages = await loadGraphemeImages(htmlString);
```
Rendering the entire component to HTML just to scan for emojis is wasteful — it doubles the rendering work.

**Fix:** Extract emoji detection from props/uiCode directly (string scan) instead of full React render. Or cache emoji images per-widget.

#### 8. Memory cache has no eviction logging
LRU silently evicts items. Under load, you won't know if the cache is thrashing.

**Fix:** Add a counter/log for eviction rate. If evictions/min > threshold, it signals the cache is too small.

### P2 — Medium Impact

#### 9. IPFS public gateways list is stale
```typescript
const PUBLIC_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
];
```
`cloudflare-ipfs.com` has been unreliable. `dweb.link` is slow. Should add `https://w3s.link/ipfs/` (web3.storage) and possibly `https://nftstorage.link/ipfs/`.

#### 10. No request timeout on Box execution (`box.ts`)
The `fetch` to Box has no timeout. If Box hangs, the request hangs.

**Fix:** Add `signal: AbortSignal.timeout(10000)` to the Box fetch call.

#### 11. `auth.ts:42` allows unsigned bundles
```typescript
authorized = true; // Allow unsigned for now (legacy compat)
```
This is documented as legacy compat but should have a deprecation timeline.

#### 12. Console logging is excessive in hot path
`console.log` in `box.ts` dumps full raw data on every execution. In production at scale, this creates log noise and IO overhead.

**Fix:** Gate verbose logging behind `NODE_ENV !== 'production'` or use log levels.

#### 13. No compression on PNG responses
OG images are served as raw PNG. Adding `Content-Encoding: gzip` or using Fastify compress plugin could reduce bandwidth 30-50%.

**Fix:** `@fastify/compress` with threshold set to images.

---

## Priority Improvement Roadmap

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | Pin cache TTL 5s → 5min | 🔴 Eliminates ~90% of RPC calls | 1 line |
| 3 | CDN cache headers for static | 🔴 Eliminates repeat renders | 5 lines |
| 6 | Cache core fonts at worker startup | 🟡 Faster renders | 10 lines |
| 5 | Pre-warm worker pool | 🟡 Faster cold starts | 15 lines |
| 10 | Box fetch timeout | 🟡 Prevents hanging requests | 1 line |
| 4 | Box env validation | 🟢 Code quality | 5 lines |
| 7 | Optimize emoji detection | 🟡 ~2x render speedup | 30 lines |
| 13 | PNG compression | 🟢 Bandwidth savings | 5 lines |

**Quick wins (< 30 min):** Items 1, 3, 10, 4 — massive impact for minimal effort.
