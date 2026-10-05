import { createServerFn } from "@tanstack/react-start";

/** Endpoint público de pools recém-criadas. */
export const listarPoolsPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarPoolsNovas } = await import("./pre-lancamentos.server");
  return listarPoolsNovas();
});

/** Endpoint público de tokens recém-detectados. */
export const listarTokensRecentesPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarTokensPublicos } = await import("./pre-lancamentos.server");
  return listarTokensPublicos();
});

/** Radar consolidado de lançamentos usando somente fontes públicas. */
export const listarLancamentosPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarLancamentosPublicos } = await import("./pre-lancamentos.server");
  return listarLancamentosPublicos();
});

/** Compatibilidade com consumidores antigos. */
export const listarVendasPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarVendasPublicas } = await import("./pre-lancamentos.server");
  return listarVendasPublicas();
});

/** Endpoint público de tokens recém-criados no Pump.fun. */
export const listarTokensBondingPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarTokensBonding } = await import("./pre-lancamentos.server");
  return listarTokensBonding();
});
