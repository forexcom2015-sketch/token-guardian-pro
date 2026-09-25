export type QuizQuestion = {
  id: string;
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
};

export type Licao = {
  id: string;
  titulo: string;
  texto: string;
  sinalRuim: string;
};

export type Modulo = {
  id: string;
  numero: string;
  titulo: string;
  resumo: string;
  licoes: Licao[];
  quiz: QuizQuestion[];
};

export const modulos: Modulo[] = [
  {
    id: "liquidez-e-contrato",
    numero: "01",
    titulo: "Liquidez e contrato",
    resumo:
      "A primeira barreira contra rug pull: onde está a liquidez, quem controla o contrato e se dá para vender.",
    licoes: [
      {
        id: "lock",
        titulo: "Liquidez bloqueada (lock) ou queimada",
        texto:
          "Verifique se o LP está travado em um locker conhecido ou enviado para endereço morto (queima). Olhe duração do lock e qual % do supply de LP está travado — lock de 30 dias com 40% do pool é praticamente liquidez livre.",
        sinalRuim: "Lock curto, parcial, renovável pelo dev ou simplesmente inexistente.",
      },
      {
        id: "contrato",
        titulo: "Contrato verificado no explorer",
        texto:
          "Leia o código verificado procurando mint aberto, blacklist, pause, setFee sem teto e proxies atualizáveis. Contrato não verificado é caixa-preta.",
        sinalRuim: "Funções ocultas de mint, blacklist ou taxa que o dev muda a qualquer momento.",
      },
      {
        id: "honeypot",
        titulo: "Teste de honeypot",
        texto:
          "Antes de confiar, simule compra e venda (simulador de honeypot ou compra mínima real seguida de venda). Se a venda falha ou consome taxa absurda, é honeypot.",
        sinalRuim: "Compra passa, venda reverte ou exige slippage extremo.",
      },
      {
        id: "ownership",
        titulo: "Ownership renunciado ou multisig",
        texto:
          "Ownership deve estar renunciado ou em multisig com signatários distintos. Wallet única do dev significa que uma pessoa pode mudar taxa, pausar ou mintar.",
        sinalRuim: "Owner = wallet única do dev, sem timelock.",
      },
    ],
    quiz: [
      {
        id: "q1",
        pergunta: "O LP está travado por 21 dias e o owner segue numa wallet única. O que isso indica?",
        alternativas: [
          "Risco alto: lock curto e controle centralizado",
          "Projeto seguro, pois há lock",
          "Irrelevante se o contrato está verificado",
        ],
        correta: 0,
        explicacao:
          "Lock curto + owner centralizado permite mudar regras e retirar liquidez logo após o vencimento.",
      },
      {
        id: "q2",
        pergunta: "A compra é executada, mas toda tentativa de venda reverte. Isso é:",
        alternativas: ["Baixa liquidez temporária", "Honeypot", "Falha da carteira"],
        correta: 1,
        explicacao: "Venda bloqueada no contrato é a assinatura clássica de honeypot.",
      },
    ],
  },
  {
    id: "distribuicao-do-supply",
    numero: "02",
    titulo: "Distribuição do supply",
    resumo:
      "Como ler a concentração de holders antes de entrar. Vesting, lock de time e crescimento orgânico.",
    licoes: [
      {
        id: "top10",
        titulo: "% concentrado nas top 10 wallets",
        texto:
          "Some o saldo das 10 maiores wallets, excluindo LP, contratos de lock e endereços de queima. Uma única wallet com mais de 5–10% já é poder de dump sobre o preço.",
        sinalRuim: "Top 10 acima de 30–40% do supply circulante em wallets pessoais.",
      },
      {
        id: "vesting",
        titulo: "Wallets do time com vesting ou lock",
        texto:
          "A alocação de time/dev precisa estar em contrato de vesting com cliff e liberação gradual. Liberação imediata é convite ao despejo no primeiro pump.",
        sinalRuim: "Alocação do time líquida desde o bloco zero.",
      },
      {
        id: "holders",
        titulo: "Holders crescendo organicamente vs. bots",
        texto:
          "Cheque a curva de holders ao longo do tempo. Crescimento orgânico é contínuo e com saldos variados; farm de bots aparece como milhares de wallets criadas no mesmo bloco com valores idênticos.",
        sinalRuim: "Salto de holders em minutos com saldos clonados e sem volume real.",
      },
    ],
    quiz: [
      {
        id: "q1",
        pergunta: "Uma wallet única concentra 14% do supply. Isso indica:",
        alternativas: [
          "Risco elevado de dump unilateral",
          "Distribuição saudável do token",
          "Liquidez naturalmente alta",
        ],
        correta: 0,
        explicacao: "Acima de 5–10% em uma wallet pessoal, essa carteira sozinha define o preço.",
      },
      {
        id: "q2",
        pergunta: "3.000 holders surgiram no mesmo bloco com saldos idênticos. Leitura correta:",
        alternativas: [
          "Adoção orgânica acelerada",
          "Airdrop/bots inflando a métrica de holders",
          "Prova de liquidez profunda",
        ],
        correta: 1,
        explicacao: "Wallets clonadas no mesmo bloco são geradas, não compradores reais.",
      },
    ],
  },
  {
    id: "comportamento-on-chain",
    numero: "03",
    titulo: "Comportamento on-chain",
    resumo:
      "O que as transações contam: quem comprou primeiro, se o volume é real e quanto custa sair da posição.",
    licoes: [
      {
        id: "snipers",
        titulo: "Padrão de compras nos primeiros blocos",
        texto:
          "Mapeie os primeiros blocos após o add de liquidez. Dezenas de wallets financiadas pela mesma origem comprando no bloco 0–2 são snipers coordenados, não demanda.",
        sinalRuim: "Wallets fundeadas pelo mesmo endereço comprando simultaneamente no lançamento.",
      },
      {
        id: "wash",
        titulo: "Volume real vs. wash trading",
        texto:
          "Compare volume com número de holders e de wallets únicas negociando. Volume alto com pouquíssimos holders é dinheiro girando entre as mesmas carteiras.",
        sinalRuim: "Milhões em volume, dezenas de holders, trades repetidos de tamanho igual.",
      },
      {
        id: "slippage",
        titulo: "Slippage necessário para vender",
        texto:
          "Teste a saída: se você precisa de slippage muito alto para vender uma posição pequena, existe taxa oculta ou o pool é raso demais para o seu tamanho.",
        sinalRuim: "Venda pequena exigindo slippage de dois dígitos.",
      },
    ],
    quiz: [
      {
        id: "q1",
        pergunta: "Volume diário de US$ 2M com 40 holders. O mais provável é:",
        alternativas: ["Wash trading", "Demanda institucional", "Arbitragem saudável"],
        correta: 0,
        explicacao: "Volume desproporcional ao número de holders indica giro artificial.",
      },
      {
        id: "q2",
        pergunta: "Vender US$ 50 exige 18% de slippage. Isso sugere:",
        alternativas: [
          "Tax oculta de venda ou pool raso",
          "Alta demanda compradora",
          "Erro do agregador",
        ],
        correta: 0,
        explicacao: "Saída cara em valor pequeno aponta taxa embutida ou liquidez insuficiente.",
      },
    ],
  },
  {
    id: "tokenomics",
    numero: "04",
    titulo: "Tokenomics",
    resumo: "Para onde vai o dinheiro das taxas, como o supply se comporta e se existe utilidade real.",
    licoes: [
      {
        id: "tax",
        titulo: "Buy/sell tax e destino",
        texto:
          "Descubra a taxa de compra e de venda e o endereço que recebe. Taxa assimétrica (venda muito maior) prende o comprador; destino em wallet pessoal é risco de extração.",
        sinalRuim: "Sell tax muito acima da buy tax, ou taxa indo para wallet única sem prestação de contas.",
      },
      {
        id: "supply",
        titulo: "Supply total e emissão contínua",
        texto:
          "Verifique supply máximo, supply circulante e se existe mecanismo de emissão contínua (mint por recompensa, rebase, inflação de staking) diluindo holders.",
        sinalRuim: "Mint sem teto ou inflação alta financiando 'recompensas'.",
      },
      {
        id: "utilidade",
        titulo: "Utilidade real vs. narrativa",
        texto:
          "Separe o que o token faz hoje (produto no ar, receita, uso on-chain) do que é promessa de roadmap. Narrativa sem produto depende só de fluxo novo para sustentar preço.",
        sinalRuim: "Roadmap genérico, zero uso on-chain além de comprar e vender.",
      },
    ],
    quiz: [
      {
        id: "q1",
        pergunta: "Buy tax 2% e sell tax 18%, ambas para a wallet do dev. Interpretação:",
        alternativas: [
          "Estrutura desenhada para punir quem sai e financiar o dev",
          "Proteção saudável contra bots",
          "Padrão de mercado",
        ],
        correta: 0,
        explicacao: "Taxa de venda muito maior, indo para wallet pessoal, é extração de valor.",
      },
      {
        id: "q2",
        pergunta: "O contrato permite mint sem teto para 'recompensas'. Isso significa:",
        alternativas: ["Diluição ilimitada dos holders", "Supply deflacionário", "Liquidez garantida"],
        correta: 0,
        explicacao: "Mint aberto dilui qualquer holder indefinidamente.",
      },
    ],
  },
  {
    id: "sinais-externos",
    numero: "05",
    titulo: "Sinais externos",
    resumo: "Fora da blockchain: comunidade, agregadores e o histórico de quem lançou o token.",
    licoes: [
      {
        id: "social",
        titulo: "Crescimento orgânico nas redes",
        texto:
          "Compare a curva de seguidores com o engajamento. Picos de milhares de seguidores sem comentários reais são compra de audiência.",
        sinalRuim: "Salto súbito de seguidores, respostas repetidas, contas recém-criadas.",
      },
      {
        id: "agregadores",
        titulo: "Presença em agregadores",
        texto:
          "Confira o par no DexScreener/DEXTools: informações preenchidas, selo de auditoria, socials verificados e pool com histórico.",
        sinalRuim: "Par sem informações, sem auditoria e sem histórico de pool.",
      },
      {
        id: "historico-dev",
        titulo: "Histórico do dev/wallet",
        texto:
          "Rastreie a wallet do deployer: procure tokens anteriores lançados pelo mesmo endereço e o que aconteceu com eles. Reincidência de rug é o sinal mais forte que existe.",
        sinalRuim: "Mesma wallet já implantou tokens que rugaram.",
      },
    ],
    quiz: [
      {
        id: "q1",
        pergunta: "A wallet do deployer já lançou dois tokens que rugaram. Decisão:",
        alternativas: ["Evitar, independentemente do resto", "Entrar pequeno", "Ignorar, é outro projeto"],
        correta: 0,
        explicacao: "Reincidência do deployer supera qualquer sinal positivo de marketing.",
      },
      {
        id: "q2",
        pergunta: "40 mil seguidores novos em um dia, com 3 comentários por post. Isso indica:",
        alternativas: ["Audiência comprada", "Viralização orgânica", "Bug da plataforma"],
        correta: 0,
        explicacao: "Seguidores sem engajamento proporcional são inflados.",
      },
    ],
  },
];

export const totalItens = modulos.reduce(
  (acc, m) => acc + m.licoes.length + m.quiz.length,
  0,
);
