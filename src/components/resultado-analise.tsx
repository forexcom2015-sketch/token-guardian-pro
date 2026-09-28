import { NivelPonto } from "@/components/shell";
import type { AnaliseReal } from "@/lib/token-ai.functions";
import { idade, linksToken, nomesRede, usd } from "@/lib/historico";

const rotuloNivel: Record<string, string> = { baixo: "Risco baixo", medio: "Risco médio", alto: "Risco alto", desconhecido: "Sem dados" };

export function ResultadoAnalise({ analise }: { analise: AnaliseReal }) {
  const { dados, parecer } = analise;
  const m = dados.mercado;
  const categorias = [...new Set(dados.checagens.map((c) => c.categoria))];
  const altos = dados.checagens.filter((c) => c.nivel === "alto").length;
  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="label-eyebrow mb-1">{nomesRede[dados.rede]} · {dados.fontes.join(" + ")}</div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {dados.nome ?? "Token"} <span className="font-mono text-sm text-muted-foreground">{dados.simbolo}</span>
            </h2>
            <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{dados.endereco}</div>
            <div className="mt-2 flex gap-3 text-xs">
              {linksToken(dados.rede, dados.endereco).map((l) => (
                <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo} ↗</a>
              ))}
            </div>
          </div>
          {parecer && (
            <div className="text-right">
              <div className="font-mono text-3xl text-card-foreground">{parecer.score}</div>
              <div className="mt-1 flex items-center justify-end gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <NivelPonto nivel={parecer.nivelGeral} /> {rotuloNivel[parecer.nivelGeral]}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
          {[
            ["Preço", usd(m?.precoUsd)],
            ["Liquidez", usd(m?.liquidezUsd)],
            ["FDV", usd(m?.fdv)],
            ["Holders", dados.holders?.toLocaleString("pt-BR") ?? "—"],
            ["Idade do par", idade(m?.criadoEm)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md bg-background p-2 ring-1 ring-border">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
              <div className="mt-1 font-mono text-card-foreground">{v}</div>
            </div>
          ))}
        </div>
        <AoVivo rede={dados.rede} endereco={dados.endereco} />
      </div>

      {parecer ? (
        <div className="panel p-5">
          <div className="label-eyebrow mb-2">Parecer da IA</div>
          <p className="text-sm text-card-foreground">{parecer.resumo}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Lista titulo="Pontos de atenção" itens={parecer.pontosAtencao} />
            <Lista titulo="Próximos passos" itens={parecer.proximosPassos} />
          </div>
        </div>
      ) : (
        <div className="panel p-4 text-xs text-muted-foreground">Parecer da IA indisponível: {analise.erroIA}. O checklist abaixo usa só os dados reais.</div>
      )}

      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="label-eyebrow">Checklist com dados reais</div>
          <span className="text-xs text-muted-foreground">{altos} alerta(s) de risco alto</span>
        </div>
        {categorias.map((cat) => (
          <div key={cat} className="mb-4">
            <div className="mb-2 text-xs font-medium text-card-foreground">{cat}</div>
            <div className="divide-y divide-border rounded-md ring-1 ring-border">
              {dados.checagens.filter((c) => c.categoria === cat).map((c) => (
                <div key={c.criterio} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <NivelPonto nivel={c.nivel} />
                  <span className="w-48 shrink-0 text-card-foreground">{c.criterio}</span>
                  <span className="flex-1 text-muted-foreground">{c.valor}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{rotuloNivel[c.nivel]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Sinais externos como redes sociais e selos de auditoria precisam de checagem manual. Conteúdo educacional, não é recomendação de investimento.</p>
      </div>
    </div>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-card-foreground">{titulo}</div>
      <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {itens.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
