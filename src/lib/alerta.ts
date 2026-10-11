import type { NotaRisco, Rede } from "./onchain.server";

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

type CandidatoAlerta = {
  rede: Rede;
  liquidezUsd: number | null;
  risco: NotaRisco;
};

const CRITERIOS_CRITICOS: Record<Rede, RegExp[]> = {
  solana: [/^Mint authority$/i, /^Freeze authority$/i],
  bsc: [/^Honeypot$/i, /^Mint oculto$/i],
  base: [/^Honeypot$/i, /^Mint oculto$/i],
  ethereum: [/^Honeypot$/i, /^Mint oculto$/i],
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

  const criterios = CRITERIOS_CRITICOS[rede];
  for (const criterio of criterios) {
    const verificacao = risco.itens.find((item) => criterio.test(item.criterio));
    if (!verificacao) {
      motivos.push(`Verificação crítica ausente: ${criterio.source.replace(/\^|\$|\\/g, "")}`);
    } else if (verificacao.nivel !== "baixo") {
      motivos.push("Verificação crítica reprovada ou desconhecida");
      break;
    }
  }
  return motivos;
}

/** Lista por que o token NÃO pode aparecer no alerta (vazia = elegível). */
export function motivosDeExclusao({ rede, liquidezUsd, risco }: CandidatoAlerta): string[] {
  const motivos = motivosPorRisco(rede, risco);
  const minimo = LIQUIDEZ_MINIMA_USD[rede];
  if (liquidezUsd === null || !Number.isFinite(liquidezUsd)) {
    motivos.push("Liquidez desconhecida ou inválida");
  } else if (liquidezUsd < minimo) {
    motivos.push(`Liquidez abaixo do mínimo da rede ($${minimo.toLocaleString("en-US")})`);
  }
  return motivos;
}

export function elegivelParaAlerta(candidato: CandidatoAlerta): boolean {
  return motivosDeExclusao(candidato).length === 0;
}

/**
 * Compatibilidade para consumidores antigos que ainda verificam apenas a nota.
 * Não aplica liquidez mínima; novos consumidores devem usar elegivelParaAlerta.
 */
export function emFaixaDeAlerta(risco: NotaRisco): boolean {
  return !risco.semSeguranca &&
    risco.cobertura === "completa" &&
    risco.altos === 0 &&
    segurancaPct(risco.nota) >= SEGURANCA_MINIMA;
}
