# PinV Code Review — Initial Findings

## OG Service (og/)

### Architecture
Clean separation: `api/` (controllers/server) → `services/` (generator/swr/auth) → `infra/` (box/cache/chain/ipfs/renderer) → `utils/`.
SWR caching is well-implemented: L1 memory + L2 Redis, lock-based coalescing, background revalidation.

### Findings

**[BUG] generator.ts — Duplicated logic for bundle vs non-bundle path**
Lines ~50-90: The bundle and non-bundle code paths are nearly identical. Both call `executeBoxAction` with same shape. Should be refactored into a single path with optional bundle merge.

**[TECH-DEBT] swr.ts — Polling loop on cache miss**
The 20-retry × 500ms polling when lock is held (lines ~95-105) blocks for up to 10s. In high-concurrency scenarios, this ties up Fastify worker threads. Consider using Redis pub/sub or a shared promise instead.

**[GOOD] swr.ts — Graceful Redis degradation**
`safeRedis()` wrapper falls back gracefully when Redis is down. Smart design for resilience.

**[GOOD] constants.ts — Reasonable defaults**
Cache TTLs, memory limits, and worker timeouts are well-tuned for the OG use case.

**[RISK] generator.ts — No error boundary on box execution**
If `executeBoxAction` throws, the error propagates to the SWR layer which returns a stub image. But there's no timeout guard specific to box calls — relies on box's own timeout.

## Box Service (box/)

### Architecture
Clean: Hono + isolated-vm pool. Good separation of concerns (auth/crypto/keys/pool/metrics/sandbox).

### Findings

**[GOOD] pool.ts — Production-quality isolate pool**
Queue-based with backpressure, age/run limits, poisoning, warm-up. Well-engineered.

**[GOOD] metrics.ts — Full Prometheus instrumentation**
Executions, durations, pool state, queue wait — all tracked. Ready for pinv-mon to scrape.

**[NOTE] index.ts — Streaming body read**
Manual stream reading with size limits (lines ~80-110). Defensive but verbose. Could be simplified with Hono's built-in body size middleware if available.

## Contracts (contracts/)

**[NOTE] PinV.sol — uri() function is a no-op**
The `uri()` override just calls `super.uri()` regardless of whether a store exists. Should return metadata URI from the store's latest IPFS version.

**[NOTE] PinVStore.sol — No access control on receive()**
Anyone can send ETH to a store. Not a bug per se, but worth noting — creator fees accumulate here.

## lib/

**[TECH-DEBT] Shared but not properly packaged**
`lib/` is referenced by both web and og via path imports. It's declared as a workspace package (`@pinv/lib`) but has no build step and no exports field. Works with Bun's module resolution but would break in standard Node.

---

*Initial review — will continue with web/ components and tests in next pass.*
