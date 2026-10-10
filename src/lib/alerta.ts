import type { NotaRisco, Rede } from "./onchain.server";
import { CRITERIOS } from "./criterios";

/** Faixa do alerta: 85% a 100% de segurança corresponde a nota de risco 0 a 15. */
export const SEGURANCA_MINIMA = 85;

/**
 * Limites iniciais de liquidez em USD. São parâmetros provisórios, não limites
 * validados empiricamente; devem ser calibrados com dados reais antes de publicação.
 */
export const LIQUIDEZ_MINIMA_USD: Record<Rede, number> = {
  solana: 25_000,
  bsc: 25_000,
  base: 25_000,
  ethereum: 50_000,
};

/** Parâmetro provisório: pares muito novos ficam fora do alerta. Calibrar com dados reais. */
export const IDADE_MINIMA_HORAS = 24;

export type CandidatoAlerta = {
  rede: Rede;
  liquidezUsd: number | null;
  risco: NotaRisco;
  /** Timestamp (ms) de criação do par. Se omitido, a regra de idade não é aplicada. */
  criadoEm?: number | null;
};

export type AvaliacaoAlerta = { elegivel: boolean; motivos: string[] };

const CRITERIOS_CRITICOS: Record<Rede, string[]> = {
  solana: [CRITERIOS.MINT_AUTHORITY, CRITERIOS.FREEZE_AUTHORITY],
  bsc: [CRITERIOS.HONEYPOT, CRITERIOS.MINT_OCULTO],
  base: [CRITERIOS.HONEYPOT, CRITERIOS.MINT_OCULTO],
  ethereum: [CRITERIOS.HONEYPOT, CRITERIOS.MINT_OCULTO],
};

export function segurancaPct(nota: number): number {
  return Math.max(0, Math.min(100, 100 - nota));
}

function motivosPorRisco(rede: Rede, risco: NotaRisco): string[] {
  const motivos: string[] = [];
  if (risco.semSeguranca) motivos.push("Sem checagem de segurança");
  if (risco.cobertura !== "completa") motivos.push("Cobertura de dados incompleta");
  if (risco.altos > 0) motivos.push("Sinal de risco alto no checklist");
  if (segurancaPct(risco.nota) < SEGURANCA_MINIMA) {
    motivos.push(`Segurança abaixo de ${SEGURANCA_MINIMA}%`);
  }

  const falhas: string[] = [];
  for (const nome of CRITERIOS_CRITICOS[rede]) {
    const verificacao = risco.itens.find((item) => item.criterio === nome);
    if (!verificacao) {
      motivos.push(`Verificação crítica ausente: ${nome}`);
    } else if (verificacao.nivel !== "baixo") {
      falhas.push(`${nome} (${verificacao.nivel})`);
    }
  }
  if (falhas.length) {
    motivos.push("Verificação crítica reprovada ou desconhecida");
    motivos.push(`Detalhe: ${falhas.join(", ")}`);
  }
  return motivos;
}

function motivosPorIdade(criadoEm: number | null | undefined, agora: number): string[] {
  if (criadoEm === undefined) return [];
  if (criadoEm === null || !Number.isFinite(criadoEm)) return ["Idade do par desconhecida"];
  const horas = (agora - criadoEm) / 3_600_000;
  if (horas < 0) return ["Idade do par inválida"];
  if (horas < IDADE_MINIMA_HORAS) return [`Par com menos de ${IDADE_MINIMA_HORAS}h de vida`];
  return [];
}

/** Lista por que o token NÃO pode aparecer no alerta (vazia = elegível). */
export function motivosDeExclusao(
  { rede, liquidezUsd, risco, criadoEm }: CandidatoAlerta,
  agora: number = Date.now(),
): string[] {
  const motivos = motivosPorRisco(rede, risco);
  const minimo = LIQUIDEZ_MINIMA_USD[rede];
  if (liquidezUsd === null || !Number.isFinite(liquidezUsd)) {
    motivos.push("Liquidez desconhecida ou inválida");
  } else if (liquidezUsd < minimo) {
    motivos.push(`Liquidez abaixo do mínimo da rede ($${minimo.toLocaleString("en-US")})`);
  }
  motivos.push(...motivosPorIdade(criadoEm, agora));
  return motivos;
}

export function elegivelParaAlerta(candidato: CandidatoAlerta, agora: number = Date.now()): boolean {
  return motivosDeExclusao(candidato, agora).length === 0;
}

export function avaliarAlerta(candidato: CandidatoAlerta, agora: number = Date.now()): AvaliacaoAlerta {
  const motivos = motivosDeExclusao(candidato, agora);
  return { elegivel: motivos.length === 0, motivos };
}
