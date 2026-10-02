import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { GraficoRisco } from "@/components/grafico-risco";
import { ResultadoAnalise } from "@/components/resultado-analise";
import { linksToken, nomesRede, useHistorico } from "@/lib/historico";
import { serieToken, type Ponto } from "@/lib/serie";
import type { Rede } from "@/lib/token-ai.functions";

export const Route = createFileRoute("/token/$rede/$endereco")({
  head: ({ params }) => ({
    meta: [
      { title: `Histórico do token ${params.endereco.slice(0, 6)}… — Radar.IA` },
      { name: "description", content: "Pontuação de risco do token ao longo do tempo e todas as análises feitas no Radar IA." },
      { property: "og:title", content: "Histórico de risco do token — Radar.IA" },
      { property: "og:description", content: "Gráfico da pontuação de risco e análises salvas deste token." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TokenHistorico,
});

function TokenHistorico() {
  const { rede, endereco } = Route.useParams();
  const { itens } = useHistorico();
  const analises = useMemo(() => itens.filter((a) => a.dados.rede === rede && a.dados.endereco.toLowerCase() === endereco.toLowerCase()), [itens, rede, endereco]);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  useEffect(() => { setPontos(serieToken(rede, endereco, analises)); }, [rede, endereco, analises]);
  const [aberto, setAberto] = useState<string | null>(null);
  const ultima = analises[0];

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{analises.length} análises</span>}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <Link to="/painel" className="text-xs text-signal">← Painel</Link>
          <h1 className="mt-1 text-2xl font-semibold">{ultima?.dados.nome ?? "Token"} <span className="font-mono text-sm text-muted-foreground">{ultima?.dados.simbolo} · {nomesRede[rede]}</span></h1>
          <div className="break-all font-mono text-[11px] text-muted-foreground">{endereco}</div>
          <div className="mt-2 flex gap-3 text-xs">
            {linksToken(rede, endereco).map((l) => <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo} ↗</a>)}
            <Link to="/radar" search={{ rede: rede as Rede, endereco }} className="font-medium text-signal underline">Nova análise no Radar IA</Link>
          </div>
        </div>
        <div className="panel p-5">
          <div className="label-eyebrow mb-3">Pontuação de risco ao longo do tempo</div>
          <GraficoRisco pontos={pontos} />
        </div>
        <div className="panel p-5">
          <div className="label-eyebrow mb-3">Análises deste token</div>
          {!analises.length && <p className="text-xs text-muted-foreground">Nenhuma análise salva ainda. Use "Nova análise no Radar IA".</p>}
          <div className="space-y-2">
            {analises.map((a) => (
              <div key={a.geradoEm} className="rounded-md p-3 ring-1 ring-border">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex-1 text-card-foreground">{new Date(a.geradoEm).toLocaleString("pt-BR")}</span>
                  {a.risco && <span className="font-mono">Checklist {a.risco.nota}</span>}
                  {a.parecer && <span className="font-mono">IA {a.parecer.score}</span>}
                  <button onClick={() => setAberto(aberto === a.geradoEm ? null : a.geradoEm)} className="underline">{aberto === a.geradoEm ? "Fechar" : "Ver"}</button>
                </div>
                {a.parecer && <p className="mt-1 text-xs text-muted-foreground">{a.parecer.resumo}</p>}
                {aberto === a.geradoEm && <div className="mt-3"><ResultadoAnalise analise={a} /></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
