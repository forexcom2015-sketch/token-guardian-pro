import { createServerFn } from "@tanstack/react-start";

/** Endpoint exclusivo da página Pré-lançamentos. */
export const listarPoolsPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarPoolsNovas } = await import("./pre-lancamentos.server");
  return listarPoolsNovas();
});


/** Endpoint exclusivo da aba Vendas de tokens em Pré-lançamentos. */
export const listarVendasPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarVendasPublicas } = await import("./pre-lancamentos.server");
  return listarVendasPublicas();
});


/** Endpoint exclusivo da aba Curva de bonding em Pré-lançamentos. */
export const listarTokensBondingPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarTokensBonding } = await import("./pre-lancamentos.server");
  return listarTokensBonding();
});
