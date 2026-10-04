# Token Guardian Pro

Aplicação pública para análise de risco de tokens cripto. O visitante pode acessar a página inicial, consultar lançamentos, abrir o painel de risco e analisar um endereço sem criar conta ou fazer login.

## Funcionalidades

- **Radar IA:** análise de token por rede e endereço, com checklist de risco e parecer assistido por IA.
- **Pré-lançamentos:** descoberta via perfis e tokens recém-promovidos do DexScreener, com métricas de mercado e checklist de segurança sob demanda. Tokens listados podem já estar negociando; não é uma lista oficial de lançamentos futuros.
- **Top desempenho:** ranking dos candidatos recentes disponíveis nos feeds públicos, filtrados por idade do par (24h, 48h ou 7 dias) e ordenados pela variação móvel de preço em 24h. Não representa o retorno acumulado desde a criação nem o universo completo de lançamentos.
- **Painel de risco:** visualização comparativa de indicadores e alertas.
- **Histórico local:** as análises são guardadas no navegador do usuário; não é necessário criar conta.

## Fontes de dados

O projeto integra serviços externos de dados de mercado e segurança on-chain, incluindo endpoints públicos do DexScreener para descoberta e mercado, GoPlus Security para indicadores de contrato e consultas específicas à blockchain Solana quando disponíveis. A página de pré-lançamentos explica a origem dos dados e permite abrir o checklist por token sem chamar a IA. Os resultados dependem da disponibilidade e qualidade das fontes.

## Aviso de risco

Os indicadores são informativos e não constituem recomendação financeira. Nenhuma análise automatizada garante que um token seja seguro ou que uma operação seja lucrativa. Dados ausentes devem ser tratados como não verificados.

## Desenvolvimento

O projeto usa React, TypeScript, TanStack Start, Vite e Supabase para as integrações existentes. Para desenvolver localmente:

```sh
npm install
npm run dev
```

Scripts disponíveis em `package.json`: `npm run build`, `npm run lint`.

As alterações de código devem ser feitas diretamente na branch `main` do GitHub. Não é necessário acionar o agente do Lovable para cada edição.
