import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { PedirLogin } from "@/components/login";
import { useCotacoes, ValorVivo, pct } from "@/components/ao-vivo";
import { linksToken, nomesRede, usd, useHistorico, type AnaliseSalva } from "@/lib/historico";

export const Route = createFileRoute("/rastreio")({
  head: () => ({
    meta: [
      { title: "Rastreio ao vivo — Radar.IA" },
      { name: "description", content: "Acompanhe os tokens analisados com pontuação, data e preço, liquidez e volume atualizados ao vivo." },
      { property: "og:title", content: "Rastreio ao vivo — Radar.IA" },
      { property: "og:description", content: "Preço, liquidez e volume ao vivo dos tokens que você analisou." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rastreio,
});

function Rastreio() {
  const { itens, logado, carregando } = useHistorico();
  // Um token por linha: a análise mais recente de cada endereço.
  const unicos = itens.filter((a, i) => itens.findIndex((b) => b.dados.endereco === a.dados.endereco) === i);
  const q = useCotacoes(unicos.map((a) => ({ rede: a.dados.rede, endereco: a.dados.endereco })));
  return (
    <Shell status={<span className="text-signal">{q.isFetching ? "Atualizando…" : "Ao vivo · 20 s"}</span>}>
      <h1 className="mb-2 text-2xl font-semibold">Rastreio</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Tokens que você analisou, com preço, liquidez e volume do GeckoTerminal. Valores piscam em verde ou vermelho quando mudam.
      </p>
      {!carregando && !logado && <PedirLogin motivo="Entre para rastrear os tokens que você analisou em qualquer aparelho." />}
      {logado && !carregando && !unicos.length && (
        <div className="panel p-6 text-sm text-muted-foreground">
          Nada para rastrear ainda. <Link to="/lancamentos" className="text-signal underline">Analise um token novo</Link>.
        </div>
      )}
      {unicos.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                {["Token", "Pontuação", "Analisado em", "Preço", "Desde a análise", "Liquidez", "Volume 24h", "1h", "Links"].map((h) => (
                  <th key={h} className="px-3 py-2 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unicos.map((a) => <Linha key={a.id} a={a} c={q.data?.[a.dados.endereco]} />)}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

function Linha({ a, c }: { a: AnaliseSalva; c: import("@/components/ao-vivo").Cotacao | undefined }) {
  const d = a.dados;
  const precoAnalise = d.mercado?.precoUsd ?? null;
  const desde = c?.precoUsd != null && precoAnalise ? ((c.precoUsd - precoAnalise) / precoAnalise) * 100 : null;
  const altos = d.checagens.filter((x) => x.nivel === "alto").length;
  return (
    <tr>
      <td className="px-3 py-2">
        <div className="font-medium text-card-foreground">{d.nome ?? "Token"}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{d.simbolo} · {nomesRede[d.rede]}</div>
      </td>
      <td className="px-3 py-2">
        <span className="font-mono text-base text-card-foreground">{a.parecer?.score ?? "—"}</span>
        <span className="ml-2 text-[10px] text-danger">{altos} alto</span>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{new Date(a.geradoEm).toLocaleString("pt-BR")}</td>
      <td className="px-3 py-2"><ValorVivo valor={c?.precoUsd} texto={usd(c?.precoUsd)} /></td>
      <td className={`px-3 py-2 font-mono ${desde == null ? "text-muted-foreground" : desde >= 0 ? "text-signal" : "text-danger"}`}>{pct(desde)}</td>
      <td className="px-3 py-2"><ValorVivo valor={c?.liquidezUsd} texto={usd(c?.liquidezUsd)} /></td>
      <td className="px-3 py-2"><ValorVivo valor={c?.volume24h} texto={usd(c?.volume24h)} /></td>
      <td className="px-3 py-2 font-mono text-muted-foreground">{pct(c?.variacao1h)}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {linksToken(d.rede, d.endereco).map((l) => (
            <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo}</a>
          ))}
          <Link to="/radar" search={{ rede: d.rede, endereco: d.endereco }} className="text-card-foreground underline">Reanalisar</Link>
        </div>
      </td>
    </tr>
  );
}
