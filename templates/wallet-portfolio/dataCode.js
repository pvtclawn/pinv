// Widget 2: Wallet Portfolio Summary
// dataCode — runs in isolated V8 sandbox
// Uses free public RPC + CoinGecko (no API key needed)

const main = async (jsParams) => {
  console.log("Starting wallet portfolio with params:", jsParams);

  const address = jsParams.address || "";
  const rpcUrl = jsParams.rpc_url || "https://mainnet.base.org";

  let result = {
    address: address,
    displayAddr: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No Address",
    totalValueUsd: "$0.00",
    ethBalance: "0",
    ethValueUsd: "$0.00",
    ethPrice: 0,
    tokens: [],
    chain: "Base",
    error: true,
    errorMsg: ""
  };

  if (!address) {
    result.errorMsg = "No wallet address provided";
    return result;
  }

  try {
    // 1. Get ETH balance via RPC
    console.log("Fetching ETH balance from:", rpcUrl);
    const balResp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"]
      })
    });

    let ethBalanceWei = 0n;
    if (balResp && balResp.ok) {
      const balData = await balResp.json();
      console.log("Balance response:", JSON.stringify(balData));
      if (balData && balData.result) {
        ethBalanceWei = BigInt(balData.result);
      }
    }

    const ethBalance = Number(ethBalanceWei) / 1e18;
    console.log("ETH balance:", ethBalance);

    // 2. Get ETH price from CoinGecko
    console.log("Fetching ETH price...");
    let ethPrice = 0;
    try {
      const priceResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true");
      if (priceResp && priceResp.ok) {
        const priceData = await priceResp.json();
        if (priceData && priceData.ethereum) {
          ethPrice = priceData.ethereum.usd || 0;
        }
      }
    } catch (e) {
      console.error("Price fetch failed:", e);
    }

    const ethValueUsd = ethBalance * ethPrice;
    const totalValue = ethValueUsd;

    result.ethBalance = ethBalance.toFixed(4);
    result.ethPrice = ethPrice;
    result.ethValueUsd = formatUsd(ethValueUsd);
    result.totalValueUsd = formatUsd(totalValue);
    result.tokens = [
      {
        symbol: "ETH",
        balance: ethBalance.toFixed(4),
        valueUsd: formatUsd(ethValueUsd),
        pct: 100,
        change24h: (priceData?.ethereum?.usd_24h_change || 0).toFixed(1)
      }
    ];
    result.error = false;
    console.log("Portfolio processed successfully");

  } catch (e) {
    console.error("Widget execution failed:", e);
    result.errorMsg = "Failed to fetch wallet data";
  }

  return result;
};

function formatUsd(n) {
  if (n == null || isNaN(n)) return "$0.00";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + n.toFixed(2);
}

main;
