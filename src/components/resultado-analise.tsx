import { NivelPonto } from "@/components/shell";
import type { AnaliseReal } from "@/lib/token-ai.functions";
import { idade, linksToken, nomesRede, usd } from "@/lib/historico";

const rotuloNivel: Record<string, string> = { baixo: "Risco baixo", medio: "Risco médio", alto: "Risco alto", desconhecido: "Sem dados" };

export function ResultadoAnalise({ analise }: { analise: AnaliseReal }) {
  const { dados, risco, parecer } = analise;
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
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score oficial de risco</div>
            <div className="font-mono text-3xl text-card-foreground">{risco.nota}</div>
            <div className="mt-1 flex items-center justify-end gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <NivelPonto nivel={risco.nivel} /> {rotuloNivel[risco.nivel]}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Cobertura: {risco.cobertura === "completa" ? "completa" : risco.cobertura === "parcial" ? "parcial" : "insuficiente"}
            </div>
          </div>
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
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-eyebrow mb-1">Detector de manipulação</div>
            <h3 className="text-lg font-semibold text-card-foreground">Atividade suspeita no lançamento</h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Avaliação determinística de liquidez, giro de volume, desequilíbrio de compras/vendas e atividade inicial. Não confirma bots nem identifica carteiras coordenadas.
            </p>
          </div>
          <div className="min-w-24 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Suspeita</div>
            <div className={`mt-1 text-lg font-semibold ${analise.manipulacao?.nivel === "alto" ? "text-danger" : analise.manipulacao?.nivel === "moderado" ? "text-warning" : "text-card-foreground"}`}>
              {analise.manipulacao?.nivel === "alto" ? "Alta" : analise.manipulacao?.nivel === "moderado" ? "Moderada" : analise.manipulacao?.nivel === "baixo" ? "Baixa" : "Indeterminada"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {analise.manipulacao?.score == null ? "Score —" : `Score ${analise.manipulacao.score}/100`}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-border">
          {analise.manipulacao?.observacao ?? "Esta análise salva foi criada antes do detector estar disponível. Faça uma nova análise para avaliar os sinais de negociação."}
        </div>
        {analise.manipulacao?.sinais?.length ? (
          <div className="mt-3 space-y-2">
            {analise.manipulacao.sinais.map((s) => (
              <div key={s.codigo} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-card-foreground">{s.titulo}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">+{s.pontos} pontos · {s.nivel}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.evidencia}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Nenhum sinal de alerta foi calculado a partir dos indicadores agregados disponíveis.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>Cobertura: {analise.manipulacao?.cobertura ?? "não disponível"}</span>
          {analise.manipulacao?.idadeParMinutos != null && <span>Idade do par: {analise.manipulacao.idadeParMinutos} min</span>}
        </div>
        {analise.manipulacao?.limitacoes?.length ? (
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-card-foreground">Limitações e como interpretar</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {analise.manipulacao.limitacoes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        ) : null}
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-eyebrow mb-1">Análise on-chain de transações</div>
            <h3 className="text-lg font-semibold text-card-foreground">Padrões de atividade por carteira</h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Amostra de trades individuais do pool público. Procura repetição, compras e vendas pela mesma origem e frequência elevada.
            </p>
          </div>
          <div className="min-w-24 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Padrão suspeito</div>
            <div className={`mt-1 text-lg font-semibold ${analise.transacoes?.nivel === "alto" ? "text-danger" : analise.transacoes?.nivel === "moderado" ? "text-warning" : "text-card-foreground"}`}>
              {analise.transacoes?.nivel === "alto" ? "Alto" : analise.transacoes?.nivel === "moderado" ? "Moderado" : analise.transacoes?.nivel === "baixo" ? "Baixo" : "Indeterminado"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {analise.transacoes?.score == null ? "Score —" : `Score ${analise.transacoes.score}/100`}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          {[
            ["Trades analisados", String(analise.transacoes?.transacoesAmostradas ?? 0)],
            ["Origens únicas", String(analise.transacoes?.carteirasUnicas ?? 0)],
            ["Compraram e venderam", String(analise.transacoes?.carteirasCompraramEVenderam ?? 0)],
            ["Alta frequência", String(analise.transacoes?.carteirasAltaFrequencia ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-background p-3 ring-1 ring-border">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
              <div className="mt-1 font-mono text-lg text-card-foreground">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-border">
          {analise.transacoes?.observacao ?? "Esta análise salva não contém dados individuais de transações. Execute uma nova análise para consultar a amostra pública."}
        </div>
        {analise.transacoes?.evidencias?.length ? (
          <div className="mt-3">
            <div className="mb-2 text-xs font-medium text-card-foreground">Origens com mais operações na amostra</div>
            <div className="space-y-2">
              {analise.transacoes.evidencias.map((w) => (
                <div key={w.endereco} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-xs text-card-foreground">{w.endereco.slice(0, 8)}…{w.endereco.slice(-6)}</code>
                    <span className="text-[10px] text-muted-foreground">{w.operacoes} operações · {w.operacoesEmMinuto} em 1 min</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{w.compras} compras · {w.vendas} vendas</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>Fonte: {analise.transacoes?.fonte ?? "não disponível"}</span>
          <span>Cobertura: {analise.transacoes?.cobertura ?? "não disponível"}</span>
          <span>Operações de origens repetidas: {analise.transacoes?.percentualOperacoesDeCarteirasRepetidas == null ? "—" : `${analise.transacoes.percentualOperacoesDeCarteirasRepetidas}%`}</span>
        </div>
        {analise.transacoes?.limitacoes?.length ? (
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-card-foreground">Limitações e interpretação</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {analise.transacoes.limitacoes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        ) : null}
      </div>

      {parecer ? (
        <div className="panel p-5">
          <div className="label-eyebrow mb-2">Interpretação da IA</div>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="label-eyebrow">Checklist com dados reais</div>
            <div className="mt-1 text-[10px] text-muted-foreground">Score determinístico: maior = mais arriscado · {risco.desconhecidos} item(ns) sem evidência suficiente</div>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{altos} alerta(s) de risco alto</span>
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
        <p className="text-[11px] text-muted-foreground">Sinais externos como redes sociais e selos de auditoria precisam de checagem manual. Ausência de dados é tratada como desconhecida, não como segurança. Conteúdo educacional, não é recomendação de investimento.</p>
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
