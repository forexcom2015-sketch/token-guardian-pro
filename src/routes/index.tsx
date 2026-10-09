import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Token Guardian IA — inteligência e risco cripto" },
      { name: "description", content: "Conheça o Token Guardian IA: radar de tokens, lançamentos, pré-lançamentos, ranking semanal e análise pública de riscos cripto." },
      { property: "og:title", content: "Token Guardian IA — inteligência e risco cripto" },
      { property: "og:description", content: "Explore mercado, desempenho e indicadores de segurança de tokens em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const paginas = [
  {
    numero: "01",
    titulo: "Radar IA",
    texto: "Investigue um token pelo endereço e pela rede. Consulte os dados de mercado e os indicadores de segurança disponíveis para orientar sua própria due diligence.",
    destino: "/radar",
    acao: "Analisar um token",
  },
  {
    numero: "02",
    titulo: "Lançamentos",
    texto: "Explore tokens que já têm pares de negociação detectados. Compare idade do par, liquidez, FDV, volume, atividade de compra e venda e variação de preço.",
    destino: "/lancamentos",
    acao: "Ver lançamentos",
  },
  {
    numero: "03",
    titulo: "Pré-lançamentos",
    texto: "Área reservada a anúncios antes do início da negociação. A integração de fontes de launchpads e anúncios oficiais ainda está pendente; não tratamos tokens já negociados como futuros lançamentos.",
    destino: "/pre-lancamentos",
    acao: "Ver pré-lançamentos",
  },
  {
    numero: "04",
    titulo: "Top desempenho",
    texto: "Consulte o Top 10 de candidatos recentes nas janelas de 24 horas, 48 horas e 7 dias, ordenados pela variação móvel de preço nas últimas 24 horas.",
    destino: "/desempenho",
    acao: "Abrir Top 10",
  },
  {
    numero: "05",
    titulo: "Painel de risco",
    texto: "Acesse a visão geral dos indicadores disponíveis no painel para contextualizar atividade e risco de mercado.",
    destino: "/painel",
    acao: "Abrir painel",
  },
  {
    numero: "06",
    titulo: "Histórico local",
    texto: "Consulte o histórico mantido localmente pelo navegador. Como os dados são locais, eles não representam um histórico global ou sincronizado entre dispositivos.",
    destino: "/historico",
    acao: "Ver histórico",
  },
];

function Inicio() {
  return (
    <Shell status={<span className="text-signal">Acesso público · sem login</span>}>
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="panel relative overflow-hidden p-7 sm:p-10 lg:p-14">
          <div className="label-eyebrow mb-3">TOKEN GUARDIAN · INTELIGÊNCIA ON-CHAIN</div>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-card-foreground sm:text-4xl lg:text-5xl">
            Mais contexto para investigar tokens. <span className="text-signal">Mais clareza sobre os riscos.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            O Token Guardian IA reúne descoberta de ativos, métricas de mercado e verificações de segurança em uma experiência pública. Use as ferramentas para pesquisar, comparar evidências e identificar o que ainda precisa ser verificado — antes de tomar qualquer decisão.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/radar" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Começar análise</Link>
            <Link to="/desempenho" className="rounded-md border border-border px-5 py-3 text-sm text-card-foreground">Explorar Top 10 semanal</Link>
            <Link to="/lancamentos" className="rounded-md border border-border px-5 py-3 text-sm text-card-foreground">Tokens lançados</Link>
          </div>
          <div className="mt-8 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
            <div><div className="text-xs font-semibold text-card-foreground">Dados de mercado</div><p className="mt-1 text-xs text-muted-foreground">Pares e métricas disponíveis publicamente.</p></div>
            <div><div className="text-xs font-semibold text-card-foreground">Verificações de risco</div><p className="mt-1 text-xs text-muted-foreground">Sinais on-chain e dados de segurança quando disponíveis.</p></div>
            <div><div className="text-xs font-semibold text-card-foreground">Transparência</div><p className="mt-1 text-xs text-muted-foreground">Dados ausentes não devem ser interpretados como segurança.</p></div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <div className="label-eyebrow mb-2">Explore a plataforma</div>
            <h2 className="text-2xl font-semibold text-card-foreground">Cada ferramenta, uma finalidade</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">As páginas são separadas para diferenciar descoberta, ativos já negociados, desempenho e investigação de risco.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginas.map((p) => (
              <article key={p.numero} className="panel flex flex-col p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-signal">{p.numero} / 06</span>
                  <span className="h-2 w-2 rounded-full bg-signal" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{p.titulo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
                <Link to={p.destino} className="mt-5 inline-flex w-fit rounded-md border border-border px-3 py-2 text-xs font-medium text-card-foreground hover:bg-secondary">{p.acao} ↗</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="panel p-6 sm:p-7">
            <div className="label-eyebrow mb-2">Desempenho semanal</div>
            <h2 className="text-xl font-semibold text-card-foreground">Top 10 dos últimos 7 dias</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A página Top desempenho mostra até dez candidatos encontrados nos feeds públicos disponíveis, com idade do par de até sete dias. O ranking é ordenado pela variação móvel de preço em 24 horas — não pelo ganho acumulado desde o lançamento.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Variações muito altas podem ocorrer em tokens com pouca liquidez, poucos negócios ou grande volatilidade. O ranking é uma lista de observação, não uma previsão de retorno.
            </p>
            <Link to="/desempenho" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground">Consultar ranking semanal</Link>
          </article>
          <article className="panel p-6 sm:p-7">
            <div className="label-eyebrow mb-2">Segurança não é promessa</div>
            <h2 className="text-xl font-semibold text-card-foreground">Como encontrar opções relativamente menos arriscadas</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Não existe uma lista capaz de garantir quais tokens são “os mais seguros”. Para uma triagem inicial, investigue contratos e permissões, liquidez real, concentração dos detentores, possibilidade de vender, atividade de negociação e confiabilidade das fontes.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Dê preferência à análise de evidências verificáveis e trate qualquer indicador ausente como desconhecido. Um score baixo não elimina riscos, e um token com bom desempenho pode continuar sendo extremamente arriscado.
            </p>
            <Link to="/radar" className="mt-5 inline-flex rounded-md border border-border px-4 py-2.5 text-xs font-medium text-card-foreground">Investigar um token</Link>
          </article>
        </section>

        <section className="panel p-6 sm:p-8">
          <div className="label-eyebrow mb-2">Metodologia transparente</div>
          <h2 className="text-2xl font-semibold text-card-foreground">Como calculamos o risco de um token</h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            O Radar combina verificações de segurança e indicadores de mercado disponíveis para o endereço e a rede selecionados. Cada verificação recebe uma classificação técnica; a nota oficial é calculada por regras determinísticas do sistema. A IA pode explicar os resultados, mas não recalcula nem substitui a nota.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Contrato e permissões</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Verifica contrato aberto/verificado, honeypot e capacidade de venda, criação de tokens (mint), blacklist, pausa de transferências, controle do proprietário e taxas de compra/venda ou transferência, conforme a rede.</p>
            </article>
            <article className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Liquidez e mercado</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Considera liquidez em USD, indícios de liquidez travada ou queimada, volume de 24 horas e contagem de compras e vendas. Liquidez abaixo de US$ 10 mil é classificada como alta exposição; abaixo de US$ 50 mil, como média.</p>
            </article>
            <article className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Distribuição e sinais on-chain</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Analisa a concentração das dez maiores carteiras/contas, a carteira do criador quando informada e, na Solana, autoridades de mint e freeze. A cobertura depende dos dados retornados pela rede e pela fonte.</p>
            </article>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-card-foreground">Pontuação oficial: 0 a 100</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Cada verificação contribui para a nota: risco alto = 15 pontos; médio = 6; desconhecido = 4; baixo = 0. A nota é limitada a 100. Se não houver uma fonte de segurança reconhecida, são acrescentados 50 pontos; sinais críticos de honeypot, freeze ou mint classificados como altos acrescentam mais 25 pontos.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <div className="font-mono text-xs text-signal">0–19 PONTOS</div>
                <h4 className="mt-2 text-sm font-semibold text-card-foreground">Risco baixo</h4>
                <p className="mt-1 text-xs text-muted-foreground">Poucos pontos acumulados nas verificações disponíveis; não é garantia de segurança.</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="font-mono text-xs text-signal">20–49 PONTOS</div>
                <h4 className="mt-2 text-sm font-semibold text-card-foreground">Risco médio</h4>
                <p className="mt-1 text-xs text-muted-foreground">Há fatores de atenção que devem ser examinados antes de qualquer decisão.</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="font-mono text-xs text-signal">50–100 PONTOS</div>
                <h4 className="mt-2 text-sm font-semibold text-card-foreground">Risco alto</h4>
                <p className="mt-1 text-xs text-muted-foreground">A pontuação acumulada indica maior exposição ou sinais críticos.</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-card-foreground">Fontes e limites da análise</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Os dados atuais são obtidos do DexScreener para pares e métricas de mercado, do GoPlus Security para verificações de segurança e da RPC pública da Solana quando aplicável. A cobertura varia por rede e token. A nota considera os itens retornados, portanto não é uma auditoria completa do contrato nem uma previsão de desempenho.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A cobertura aparece como insuficiente quando não há checagem de segurança reconhecida, parcial quando existem três ou mais verificações desconhecidas, e completa quando essas condições não se aplicam. “Completa” descreve apenas a cobertura do checklist, não significa que todos os riscos possíveis foram eliminados.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Um indicador desconhecido não significa que o token passou no teste. APIs podem não ter dados, a liquidez pode ainda não existir ou uma função pode não ser verificável. Confira os detalhes, a rede e o endereço do contrato; nunca interprete a nota como recomendação de compra ou garantia de segurança.
            </p>
            <Link to="/radar" className="mt-5 inline-flex rounded-md border border-border px-4 py-2.5 text-xs font-medium text-card-foreground">Verificar um token no Radar ↗</Link>
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          <div className="label-eyebrow mb-2">Entenda os riscos do mercado</div>
          <h2 className="text-2xl font-semibold text-card-foreground">O que pode dar errado?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Baixa liquidez e slippage</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">O preço exibido pode não ser o preço executável. Uma venda pode movimentar o mercado ou não encontrar compradores suficientes.</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Rug pull e concentração</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Detentores concentrados, liquidez removível ou permissões privilegiadas podem aumentar o risco de perdas abruptas.</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Contratos maliciosos</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Restrições de venda, taxas abusivas e funções administrativas podem não ser evidentes apenas pelo nome ou símbolo do token.</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Volatilidade e manipulação</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Volumes curtos, negociações coordenadas e movimentos extremos podem criar sinais enganosos de procura.</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Dados incompletos ou atrasados</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">APIs podem falhar, atrasar ou não cobrir todos os tokens. Ausência de alerta não equivale a aprovação de segurança.</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">Golpes e falsificações</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Tokens podem copiar nomes, símbolos e logotipos de projetos legítimos. Confirme sempre o endereço do contrato em fontes oficiais.</p>
            </div>
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          <div className="label-eyebrow mb-2">Fluxo recomendado</div>
          <h2 className="text-2xl font-semibold text-card-foreground">Como usar o Token Guardian</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-md bg-secondary/50 p-4"><span className="font-mono text-xs text-signal">PASSO 01</span><p className="mt-2 text-sm font-medium text-card-foreground">Descubra</p><p className="mt-1 text-xs text-muted-foreground">Veja lançamentos e candidatos recentes.</p></li>
            <li className="rounded-md bg-secondary/50 p-4"><span className="font-mono text-xs text-signal">PASSO 02</span><p className="mt-2 text-sm font-medium text-card-foreground">Compare</p><p className="mt-1 text-xs text-muted-foreground">Use desempenho, volume e liquidez com contexto.</p></li>
            <li className="rounded-md bg-secondary/50 p-4"><span className="font-mono text-xs text-signal">PASSO 03</span><p className="mt-2 text-sm font-medium text-card-foreground">Investigue</p><p className="mt-1 text-xs text-muted-foreground">Abra o Radar e confira alertas e dados desconhecidos.</p></li>
            <li className="rounded-md bg-secondary/50 p-4"><span className="font-mono text-xs text-signal">PASSO 04</span><p className="mt-2 text-sm font-medium text-card-foreground">Verifique fora da plataforma</p><p className="mt-1 text-xs text-muted-foreground">Confirme contrato, fontes oficiais, liquidez e condições de venda.</p></li>
          </ol>
        </section>

        <section className="rounded-lg border border-warn/30 bg-secondary/30 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-card-foreground">Aviso de risco</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Criptoativos, especialmente tokens recém-lançados, podem perder grande parte ou todo o valor investido. O Token Guardian IA é uma ferramenta informativa; seus dados e pontuações podem ser incompletos, incorretos ou indisponíveis. Nada aqui constitui recomendação financeira, garantia de segurança ou promessa de rentabilidade. Faça sua própria investigação e nunca arrisque recursos que não pode perder.
          </p>
        </section>
      </div>
    </Shell>
  );
}
