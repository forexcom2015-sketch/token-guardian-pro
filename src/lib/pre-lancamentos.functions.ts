import { createServerFn } from "@tanstack/react-start";

/** Endpoint exclusivo da página Pré-lançamentos. */
export const listarPoolsPreLancamento = createServerFn({ method: "GET" }).handler(async () => {
  const { listarPoolsNovas } = await import("./pre-lancamentos.server");
  return listarPoolsNovas();
});
