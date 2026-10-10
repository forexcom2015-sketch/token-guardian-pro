import { describe, expect, it } from "vitest";
import { notaRisco, type Checagem, type Rede } from "./onchain.server";
import { CRITERIOS } from "./criterios";
import {
  avaliarAlerta,
  elegivelParaAlerta,
  IDADE_MINIMA_HORAS,
  LIQUIDEZ_MINIMA_USD,
  motivosDeExclusao,
  segurancaPct,
  SEGURANCA_MINIMA,
} from "./alerta";

const c = (criterio: string, nivel: Checagem["nivel"]): Checagem => ({
  categoria: "Teste",
  criterio,
  nivel,
  valor: "v",
});

const criticosSolana = [c("Mint authority", "baixo"), c("Freeze authority", "baixo")];
const criticosEvm = [c("Honeypot", "baixo"), c("Mint oculto", "baixo")];
const base: { rede: Rede; liquidezUsd: number | null; criadoEm?: number | null } = { rede: "solana", liquidezUsd: 60_000 };
const cand = (
  checagens: Checagem[],
  extra: Partial<typeof base> = {},
  semSeg = false,
) => ({ ...base, ...extra, risco: notaRisco(checagens, semSeg) });

describe("alerta de alta segurança", () => {
  it("usa 85% como mínimo", () => expect(SEGURANCA_MINIMA).toBe(85));

  it("aceita token Solana com verificações críticas aprovadas e liquidez suficiente", () => {
    expect(elegivelParaAlerta(cand(criticosSolana))).toBe(true);
  });

  it("aceita token EVM com verificações críticas aprovadas e liquidez suficiente", () => {
    expect(elegivelParaAlerta(cand(criticosEvm, { rede: "base" }))).toBe(true);
  });

  it("aceita nota 12 (88%)", () => {
    const r = cand([...criticosSolana, c("A", "medio"), c("B", "medio")]);
    expect(r.risco.nota).toBe(12);
    expect(elegivelParaAlerta(r)).toBe(true);
  });

  it("rejeita nota 18 (82%): passava com o limite temporário de 80%", () => {
    const r = cand([...criticosSolana, c("A", "medio"), c("B", "medio"), c("C", "medio")]);
    expect(r.risco.nota).toBe(18);
    expect(r.risco.nivel).toBe("baixo");
    expect(elegivelParaAlerta(r)).toBe(false);
  });

  it("rejeita honeypot detectado", () => {
    expect(elegivelParaAlerta(cand([
      c("Honeypot", "alto"),
      c("Mint oculto", "baixo"),
    ], { rede: "ethereum" }))).toBe(false);
  });

  it("rejeita verificação crítica desconhecida mesmo com nota baixa", () => {
    const r = cand([
      c("Mint authority", "desconhecido"),
      c("Freeze authority", "baixo"),
    ]);
    expect(r.risco.nota).toBeLessThanOrEqual(15);
    expect(motivosDeExclusao(r)).toContain("Verificação crítica reprovada ou desconhecida");
  });

  it("rejeita quando uma verificação crítica exigida está ausente", () => {
    const motivos = motivosDeExclusao(cand([c("Taxa de compra", "baixo")]));
    expect(motivos.some((m) => m.startsWith("Verificação crítica ausente:"))).toBe(true);
  });

  it("rejeita quando a fonte de segurança está indisponível", () => {
    expect(elegivelParaAlerta(cand(criticosSolana, {}, true))).toBe(false);
  });

  it("rejeita cobertura parcial mesmo com nota baixa", () => {
    const r = cand([
      ...criticosSolana,
      c("X", "desconhecido"),
      c("Y", "desconhecido"),
      c("Z", "desconhecido"),
    ]);
    expect(r.risco.cobertura).toBe("parcial");
    expect(r.risco.nota).toBeLessThanOrEqual(15);
    expect(elegivelParaAlerta(r)).toBe(false);
  });

  it("rejeita liquidez desconhecida, inválida ou abaixo do mínimo", () => {
    expect(elegivelParaAlerta(cand(criticosSolana, { liquidezUsd: null }))).toBe(false);
    expect(elegivelParaAlerta(cand(criticosSolana, { liquidezUsd: Number.NaN }))).toBe(false);
    expect(elegivelParaAlerta(cand(criticosSolana, { liquidezUsd: 10_000 }))).toBe(false);
  });

  it("aplica mínimo de liquidez diferente por rede", () => {
    expect(elegivelParaAlerta(cand(criticosSolana, { rede: "solana", liquidezUsd: 30_000 }))).toBe(true);
    expect(elegivelParaAlerta(cand(criticosEvm, { rede: "ethereum", liquidezUsd: 30_000 }))).toBe(false);
    expect(LIQUIDEZ_MINIMA_USD.ethereum).toBe(50_000);
  });

  it("rejeita par com menos de 24h e aceita par mais antigo", () => {
    const agora = Date.now();
    expect(elegivelParaAlerta(cand(criticosSolana, { criadoEm: agora - 2 * 3_600_000 }), agora)).toBe(false);
    expect(elegivelParaAlerta(cand(criticosSolana, { criadoEm: agora - 48 * 3_600_000 }), agora)).toBe(true);
  });

  it("rejeita idade desconhecida ou futura quando o campo é informado", () => {
    expect(elegivelParaAlerta(cand(criticosSolana, { criadoEm: null }))).toBe(false);
    expect(elegivelParaAlerta(cand(criticosSolana, { criadoEm: Date.now() + 3_600_000 }))).toBe(false);
  });

  it("informa qual verificação crítica falhou", () => {
    const motivos = motivosDeExclusao(
      cand([c(CRITERIOS.MINT_AUTHORITY, "desconhecido"), c(CRITERIOS.FREEZE_AUTHORITY, "baixo")]),
    );
    expect(motivos).toContain("Verificação crítica reprovada ou desconhecida");
    expect(motivos).toContain("Detalhe: Mint authority (desconhecido)");
  });

  it("avaliarAlerta devolve elegível e motivos coerentes", () => {
    expect(avaliarAlerta(cand(criticosSolana))).toEqual({ elegivel: true, motivos: [] });
    const r = avaliarAlerta(cand(criticosSolana, { liquidezUsd: 1_000 }));
    expect(r.elegivel).toBe(false);
    expect(r.motivos.length).toBeGreaterThan(0);
  });

  it("usa mínimo de $25k fora da Ethereum e $50k na Ethereum", () => {
    expect(IDADE_MINIMA_HORAS).toBe(24);
    expect(LIQUIDEZ_MINIMA_USD.bsc).toBe(25_000);
    expect(LIQUIDEZ_MINIMA_USD.ethereum).toBe(50_000);
  });

  it("mantém a porcentagem de segurança entre 0 e 100", () => {
    expect(segurancaPct(0)).toBe(100);
    expect(segurancaPct(150)).toBe(0);
    expect(segurancaPct(-5)).toBe(100);
  });
});
