# Token Guardian Pro

Aplicação pública para análise de risco de tokens cripto. O visitante pode acessar a página inicial, consultar lançamentos, abrir o painel de risco e analisar um endereço sem criar conta ou fazer login.

## Funcionalidades

- **Radar IA:** análise de token por rede e endereço, com checklist de risco e parecer assistido por IA.
- **Lançamentos ativos:** consulta de tokens recentes e métricas de mercado.
- **Painel de risco:** visualização comparativa de indicadores e alertas.
- **Histórico local:** as análises são guardadas no navegador do usuário; não é necessário criar conta.

## Fontes de dados

O projeto integra serviços externos de dados de mercado e segurança on-chain, incluindo DexScreener e GoPlus, além de consultas específicas à blockchain quando disponíveis. Os resultados dependem da disponibilidade e qualidade das fontes.

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
