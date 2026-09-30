import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, NivelPonto } from "@/components/shell";
import { ResultadoAnalise } from "@/components/resultado-analise";
import { linksToken, nomesRede, useHistorico } from "@/lib/historico";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de análises — Radar.IA" },
      { name: "description", content: "Todos os tokens analisados no Radar IA com pontuações do checklist e links." },
      { property: "og:title", content: "Histórico de análises — Radar.IA" },
      { property: "og:description", content: "Suas análises salvas de tokens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { itens, remover, logado } = useHistorico();
  const [aberto, setAberto] = useState<string | null>(null);
  return (
    <Shell status={<span className="font-mono text-muted-foreground">{itens.length} análises</span>}>
      <h1 className="mb-2 text-2xl font-semibold">Histórico</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        {logado ? "Salvo na sua conta — aparece em qualquer dispositivo." : <>Salvo só neste navegador. <Link to="/auth" className="text-signal underline">Entre na sua conta</Link> para guardar as análises entre sessões.</>}
      </p>
      {!itens.length && (
        <div className="panel p-6 text-sm text-muted-foreground">
          Nenhuma análise ainda. <Link to="/lancamentos" className="text-signal underline">Escolha um token novo</Link> para começar.
        </div>
      )}
      <div className="space-y-3">
        {itens.map((a) => {
          const d = a.dados;
          const conta = (n: string) => d.checagens.filter((c) => c.nivel === n).length;
          return (
            <div key={a.geradoEm} className="panel p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-card-foreground">{d.nome ?? "Token"} <span className="font-mono text-xs text-muted-foreground">{d.simbolo} · {nomesRede[d.rede]}</span></div>
                  <div className="text-[11px] text-muted-foreground">{new Date(a.geradoEm).toLocaleString("pt-BR")}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><NivelPonto nivel="alto" />{conta("alto")}</span>
                  <span className="flex items-center gap-1"><NivelPonto nivel="medio" />{conta("medio")}</span>
                  <span className="flex items-center gap-1"><NivelPonto nivel="baixo" />{conta("baixo")}</span>
                  {a.parecer && <span className="font-mono text-lg text-card-foreground">{a.parecer.score}</span>}
                </div>
                <div className="flex gap-3 text-xs">
                  {linksToken(d.rede, d.endereco).map((l) => <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo}</a>)}
                  <button onClick={() => setAberto(aberto === a.geradoEm ? null : a.geradoEm)} className="text-card-foreground underline">{aberto === a.geradoEm ? "Fechar" : "Ver"}</button>
                  <button onClick={() => remover(a.geradoEm)} className="text-danger">Excluir</button>
                </div>
              </div>
              {aberto === a.geradoEm && <div className="mt-4"><ResultadoAnalise analise={a} /></div>}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
