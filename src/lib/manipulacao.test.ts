import { describe, expect, it } from "vitest";
import { detectarManipulacao } from "./manipulacao";

describe("detectarManipulacao", () => {
  it("returns indeterminate when market data is unavailable", () => {
    const result = detectarManipulacao(null);
    expect(result.nivel).toBe("indeterminado");
    expect(result.score).toBeNull();
    expect(result.cobertura).toBe("insuficiente");
  });

  it("flags high volume relative to low liquidity and extreme price movement", () => {
    const now = Date.now();
    const result = detectarManipulacao({
      liquidezUsd: 8_000,
      volume24h: 100_000,
      compras24h: 600,
      vendas24h: 10,
      compras1h: 180,
      vendas1h: 4,
      variacao24h: 180,
      criadoEm: now - 20 * 60_000,
    }, now);

    expect(result.nivel).toBe("alto");
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.sinais.some((s) => s.codigo === "giro-extremo")).toBe(true);
    expect(result.sinais.some((s) => s.codigo === "desequilibrio-h1")).toBe(true);
    expect(result.idadeParMinutos).toBe(20);
  });

  it("does not treat unavailable transaction counts as zero activity", () => {
    const result = detectarManipulacao({
      liquidezUsd: null,
      volume24h: null,
      compras24h: null,
      vendas24h: null,
      compras1h: null,
      vendas1h: null,
      variacao24h: null,
      criadoEm: null,
    });

    expect(result.nivel).toBe("indeterminado");
    expect(result.score).toBeNull();
  });

  it("reports low suspicion without claiming the token is safe", () => {
    const now = Date.now();
    const result = detectarManipulacao({
      liquidezUsd: 200_000,
      volume24h: 100_000,
      compras24h: 200,
      vendas24h: 180,
      compras1h: 12,
      vendas1h: 10,
      variacao24h: 8,
      criadoEm: now - 3 * 24 * 60 * 60_000,
    }, now);

    expect(result.nivel).toBe("baixo");
    expect(result.observacao).toContain("não garante ausência");
  });
});
