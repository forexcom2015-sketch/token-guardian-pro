import { Link } from "@tanstack/react-router";
import { idade, linksToken, nomesRede, usd } from "@/lib/historico";
import type { NotaRisco, Rede } from "@/lib/onchain.server";

export type TokenAlerta = {
  rede: Rede;
  endereco: string;
  nome: string;
  simbolo: string;
  icone: string | null;
  mercado: { liquidezUsd: number | null; criadoEm: number | null };
  risco: NotaRisco;
};

/** Faixa de alerta: 85% a 100% de segurança = nota de risco 0 a 15. */
export const SEGURANCA_MINIMA = 85;

export function segurancaPct(nota: number): number {
  return Math.max(0, Math.min(100, 100 - nota));
}

export function emFaixaDeAlerta(risco: NotaRisco): boolean {
  return !risco.semSeguranca && risco.nivel === "baixo" && segurancaPct(risco.nota) >= SEGURANCA_MINIMA;
}

export function AlertaSeguranca({ tokens }: { tokens: TokenAlerta[] }) {
  const alvo = tokens.filter((t) => emFaixaDeAlerta(t.risco));
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
          <h2 className="text-sm font-semibold text-card-foreground">Alta segurança · {SEGURANCA_MINIMA}% a 100%</h2>
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
                <div className="font-mono text-sm font-semibold text-signal">{segurancaPct(t.risco.nota)}% segurança</div>
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
      <p className="mt-3 text-[11px] text-muted-foreground">Só entram aqui tokens com checagem de segurança completa e nenhum sinal grave no checklist. Ainda assim, confira antes de decidir — não é recomendação de compra.</p>
    </section>
  );
}
