const NETWORKS = [
  { id: "solana", label: "Solana" },
  { id: "bsc", label: "BNB Chain" },
  { id: "eth", label: "Ethereum" },
  { id: "base", label: "Base" },
];
const BASE = "https://api.geckoterminal.com/api/v2";
const headers = {
  accept: "application/json;version=20230203",
  "user-agent": "TokenGuardianPro-live-smoke/1.0",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;

async function getJson(url) {
  if (calls > 0) await sleep(6_200);
  calls++;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function attributes(resource) {
  return resource?.attributes ?? {};
}

const results = [];
for (const network of NETWORKS) {
  console.log(`\n[${network.label}] discovering a live pool...`);
  try {
    const poolPayload = await getJson(`${BASE}/networks/${network.id}/trending_pools?page=1`);
    const pools = Array.isArray(poolPayload.data) ? poolPayload.data : [];
    if (!pools.length) throw new Error("API returned no trending pools");
    let success = null;
    const candidates = pools.slice(0, 2);

    for (const pool of candidates) {
      const poolAttrs = attributes(pool);
      const address = poolAttrs.address || String(pool.id ?? "").split("_").slice(1).join("_");
      if (!address) continue;
      console.log(`[${network.label}] checking trade collection for pool ${address.slice(0, 10)}…`);
      try {
        const tradePayload = await getJson(
          `${BASE}/networks/${network.id}/pools/${encodeURIComponent(address)}/trades?per_page=300`,
        );
        const trades = Array.isArray(tradePayload.data) ? tradePayload.data : [];
        const usable = trades.filter((trade) => {
          const a = attributes(trade);
          return typeof a.tx_from_address === "string"
            && a.tx_from_address.length > 0
            && ["buy", "sell"].includes(String(a.kind ?? "").toLowerCase())
            && typeof a.block_timestamp === "string";
        });
        if (usable.length) {
          success = {
            network: network.label,
            pool: address,
            poolName: poolAttrs.name ?? "unknown",
            tradesReturned: trades.length,
            usableTrades: usable.length,
            sampleHasOrigin: true,
            sampleHasDirectionAndTimestamp: true,
          };
          break;
        }
        console.warn(`[${network.label}] response had ${trades.length} trades but no usable wallet/direction/timestamp records.`);
      } catch (error) {
        console.warn(`[${network.label}] candidate pool failed: ${error.message}`);
      }
    }

    if (!success) throw new Error("No candidate pool returned usable trade-level wallet, direction and timestamp fields");
    results.push(success);
    console.log(`PASS ${JSON.stringify(success)}`);
  } catch (error) {
    results.push({ network: network.label, pass: false, error: error.message });
    console.error(`FAIL [${network.label}] ${error.message}`);
  }
}

console.log("\nLive smoke-test summary:");
for (const result of results) console.log(JSON.stringify(result));
if (results.length !== NETWORKS.length || results.some((result) => result.pass === false || !result.usableTrades)) {
  process.exitCode = 1;
} else {
  console.log(`PASS: live trade collection validated on all ${NETWORKS.length} networks.`);
}
