import { Link } from "@tanstack/react-router";
import { idade, linksToken, nomesRede, usd } from "@/lib/historico";
import type { NotaRisco, Rede } from "@/lib/onchain.server";
import { IDADE_MINIMA_HORAS, SEGURANCA_MINIMA, segurancaPct, type AvaliacaoAlerta } from "@/lib/alerta";
export { SEGURANCA_MINIMA, segurancaPct } from "@/lib/alerta";

export type TokenAlerta = {
  rede: Rede;
  endereco: string;
  nome: string;
  simbolo: string;
  icone: string | null;
  mercado: { liquidezUsd: number | null; criadoEm: number | null };
  risco: NotaRisco;
  /** Calculado no servidor em listarLancamentos. */
  alerta: AvaliacaoAlerta;
};

export function AlertaSeguranca({ tokens }: { tokens: TokenAlerta[] }) {
  const alvo = tokens.filter((t) => t.alerta.elegivel);
  if (!alvo.length) return null;

  return (
    <section className="panel mb-6 border-signal/40 p-4 sm:p-5" aria-label="Alerta de alta segurança">
      <div className="mb-3 flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
        </span>
        <div className="mr-auto">
          <div className="label-eyebrow text-signal">Alerta</div>
          <h2 className="text-sm font-semibold text-card-foreground">Pontuação de segurança {SEGURANCA_MINIMA}% a 100%</h2>
        </div>
        <span className="text-xs text-muted-foreground">{alvo.length} {alvo.length === 1 ? "token" : "tokens"} na faixa</span>
      </div>
      <ul className="grid gap-2">
        {alvo.map((t) => (
          <li key={t.rede + t.endereco} className="rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center gap-3">
              {t.icone && <img src={t.icone} alt="" className="h-7 w-7 rounded-full" loading="lazy" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-card-foreground">
                  {t.simbolo} <span className="text-xs text-muted-foreground">· {nomesRede[t.rede]}</span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{t.nome}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-signal">pontuação {segurancaPct(t.risco.nota)}%</div>
                <div className="font-mono text-[10px] text-muted-foreground">risco {t.risco.nota}/100</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>Liq {usd(t.mercado.liquidezUsd)}</span>
              <span>{idade(t.mercado.criadoEm)}</span>
              <Link to="/radar" search={{ rede: t.rede, endereco: t.endereco }} className="text-signal hover:underline">Analisar no Radar IA</Link>
              {linksToken(t.rede, t.endereco).map((l) => <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo}</a>)}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">Só entram aqui tokens com cobertura completa, verificações críticas aprovadas, liquidez mínima para a rede e par com pelo menos {IDADE_MINIMA_HORAS}h de vida. Os limites de liquidez e idade são parâmetros iniciais e serão calibrados com dados reais. A porcentagem é uma pontuação heurística, não uma probabilidade de segurança. Confira antes de decidir — não é recomendação de compra.</p>
    </section>
  );
}
