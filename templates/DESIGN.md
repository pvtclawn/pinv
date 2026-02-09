# Template Widgets — Design Notes

## Pattern Understanding (from lib/prompts.ts)

### Data Code (Box Script)
- Runs in V8 isolated-vm (no npm, no imports)
- Must export `const main = async (jsParams) => { ... }; main;`
- Use `fetch` for APIs (CoinGecko, CoinCap are free)
- Always return valid object even on failure
- Generous `console.log` for debugging

### UI Code (React → Satori)
- `export default function Widget(props) { ... }`
- Root: `<div style={{ display: 'flex', flexDirection: 'column', width: '1200px', height: '800px' }}>`
- ALL inline styles (no CSS, no Tailwind)
- No `position: absolute/fixed`, no CSS Grid, no `calc()`, no `conic-gradient`
- Can import from `lucide-react`
- Dark backgrounds, bright accents, big hero numbers

### Preview Data
- Must match EXACT shape of what dataCode returns
- Used for rendering without box execution

---

## Widget 1: Crypto Price Ticker (ETH + BTC)

**Data source:** CoinGecko free API (`/api/v3/simple/price`)
**Props shape:**
```json
{
  "eth": { "price": 2450.12, "change24h": 3.5, "trend": "up" },
  "btc": { "price": 45123.45, "change24h": -1.2, "trend": "down" },
  "lastUpdated": "2024-02-09T21:00:00Z",
  "error": false
}
```

## Widget 2: Wallet Portfolio

**Data source:** Alchemy/public RPC + CoinGecko for prices
**Props shape:**
```json
{
  "address": "0x...",
  "ensName": "vitalik.eth",
  "totalValue": "$12,345.67",
  "tokens": [
    { "symbol": "ETH", "balance": "4.2", "value": "$10,290", "pct": 83 },
    { "symbol": "USDC", "balance": "1,500", "value": "$1,500", "pct": 12 }
  ],
  "error": false
}
```

## Widget 3: ENS Profile Card

**Data source:** ENS public resolver (ethers-free via RPC calls)
**Props shape:**
```json
{
  "name": "vitalik.eth",
  "avatar": "https://...",
  "description": "Building Ethereum",
  "twitter": "@VitalikButerin",
  "url": "https://vitalik.ca",
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "error": false
}
```
