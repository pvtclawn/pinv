// Widget 1: Crypto Price Ticker (ETH + BTC)
// dataCode — runs in isolated V8 sandbox

const main = async (jsParams) => {
  console.log("Starting crypto ticker with params:", jsParams);

  let result = {
    eth: { price: "—", change24h: 0, trend: "flat" },
    btc: { price: "—", change24h: 0, trend: "flat" },
    lastUpdated: new Date().toISOString(),
    error: true,
    errorMsg: ""
  };

  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true";
    console.log("Fetching:", url);

    const resp = await fetch(url);
    if (!resp || !resp.ok) {
      console.error("CoinGecko API error:", resp?.status);
      result.errorMsg = "API unavailable";
      return result;
    }

    const data = await resp.json();
    console.log("API response:", JSON.stringify(data));

    if (data && data.ethereum) {
      const ethChange = data.ethereum.usd_24h_change || 0;
      result.eth = {
        price: formatPrice(data.ethereum.usd),
        change24h: Math.round(ethChange * 100) / 100,
        trend: ethChange > 0.5 ? "up" : ethChange < -0.5 ? "down" : "flat",
        marketCap: formatLargeNumber(data.ethereum.usd_market_cap),
        volume24h: formatLargeNumber(data.ethereum.usd_24h_vol)
      };
    }

    if (data && data.bitcoin) {
      const btcChange = data.bitcoin.usd_24h_change || 0;
      result.btc = {
        price: formatPrice(data.bitcoin.usd),
        change24h: Math.round(btcChange * 100) / 100,
        trend: btcChange > 0.5 ? "up" : btcChange < -0.5 ? "down" : "flat",
        marketCap: formatLargeNumber(data.bitcoin.usd_market_cap),
        volume24h: formatLargeNumber(data.bitcoin.usd_24h_vol)
      };
    }

    result.error = false;
    result.lastUpdated = new Date().toISOString();
    console.log("Data processed successfully");

  } catch (e) {
    console.error("Widget execution failed:", e);
    result.errorMsg = "Fetch failed";
  }

  return result;
};

function formatPrice(n) {
  if (n == null) return "—";
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLargeNumber(n) {
  if (n == null) return "—";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return "$" + n.toLocaleString("en-US");
}

main;
