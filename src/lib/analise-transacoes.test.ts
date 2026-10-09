import { afterEach, describe, expect, it, vi } from "vitest";
import { analisarTransacoesPool } from "./analise-transacoes.server";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analisarTransacoesPool", () => {
  it("detects repeated wallet trade patterns from public trade data", async () => {
    const now = Date.now();
    const data = Array.from({ length: 40 }, (_, i) => ({
      attributes: {
        tx_from_address: `0xwallet${i % 8}`,
        kind: i % 3 === 0 ? "sell" : "buy",
        block_timestamp: new Date(now - (i % 4) * 10_000).toISOString(),
        volume_in_usd: "100",
        tx_hash: `0xhash${i}`,
      },
    }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    const result = await analisarTransacoesPool("ethereum", `0x${"a".repeat(40)}`);

    expect(result.transacoesAmostradas).toBe(40);
    expect(result.carteirasUnicas).toBe(8);
    expect(result.carteirasRepetidas).toBe(8);
    expect(result.carteirasCompraramEVenderam).toBeGreaterThan(0);
    expect(result.nivel).toBe("alto");
    expect(result.evidencias.length).toBeLessThanOrEqual(10);
  });

  it("returns indeterminate when pool address is missing", async () => {
    const result = await analisarTransacoesPool("solana", null);

    expect(result.nivel).toBe("indeterminado");
    expect(result.score).toBeNull();
    expect(result.cobertura).toBe("insuficiente");
  });

  it("does not claim a bot finding when the API has no usable trades", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    const result = await analisarTransacoesPool("base", `0x${"b".repeat(40)}`);

    expect(result.nivel).toBe("indeterminado");
    expect(result.observacao).toContain("não é possível classificar");
  });
});
