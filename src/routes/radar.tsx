import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Shell } from "@/components/shell";
import { ResultadoAnalise } from "@/components/resultado-analise";
import { analisarReal, type AnaliseReal, type Rede } from "@/lib/token-ai.functions";
import { nomesRede, useHistorico } from "@/lib/historico";

const buscaSchema = z.object({
  rede: z.enum(["solana", "bsc", "ethereum", "base"]).optional(),
  endereco: z.string().optional(),
  final: z.boolean().optional(),
});

export const Route = createFileRoute("/radar")({
  validateSearch: (s) => buscaSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Radar IA — análise real de tokens" },
      { name: "description", content: "Cole o endereço de um token e veja o checklist pontuado com dados reais do DexScreener e GoPlus, mais o parecer da IA." },
      { property: "og:title", content: "Radar IA — análise real de tokens" },
      { property: "og:description", content: "Honeypot, taxas, mint, liquidez e top 10 carteiras com dados ao vivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Radar,
});

function Radar() {
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const fn = useServerFn(analisarReal);
  const { salvar } = useHistorico();
  const [rede, setRede] = useState<Rede>(busca.rede ?? "solana");
  const [endereco, setEndereco] = useState(busca.endereco ?? "");
  const alvo = busca.rede && busca.endereco ? { rede: busca.rede, endereco: busca.endereco } : null;
  const consulta = useQuery<AnaliseReal, Error>({
    queryKey: ["analise", alvo?.rede, alvo?.endereco],
    queryFn: () => fn({ data: alvo! }),
    enabled: !!alvo,
    staleTime: Infinity,
    retry: false,
  });
  const salvarRef = useRef(salvar);
  salvarRef.current = salvar;
  const salvoEm = useRef<string | null>(null);
  useEffect(() => {
    if (consulta.data && salvoEm.current !== consulta.data.geradoEm) {
      salvoEm.current = consulta.data.geradoEm;
      salvarRef.current(consulta.data);
    }
  }, [consulta.data]);
  const analise = {
    isPending: consulta.isFetching,
    isError: consulta.isError,
    error: consulta.error,
    data: consulta.data,
    mutate: (d: { rede: Rede; endereco: string }) => navigate({ search: { ...busca, ...d } }),
  };

  return (
    <Shell status={<span className="text-signal">Dados ao vivo</span>}>
      <div className="mx-auto max-w-4xl space-y-6">
        {busca.final && (
          <div className="panel p-4 text-sm text-card-foreground">
            <span className="font-medium text-signal">Análise pública.</span> Escolha um token nos{" "}
            <Link to="/lancamentos" className="text-signal underline">lançamentos ativos</Link> ou informe o endereço do token para consultar os indicadores disponíveis.
          </div>
        )}
        <div className="panel p-5">
          <div className="label-eyebrow mb-3">Analisar token real</div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              analise.mutate({ rede, endereco: endereco.trim() });
            }}
          >
            <select value={rede} onChange={(e) => setRede(e.target.value as Rede)} className="rounded-lg bg-background px-3 py-2 text-xs text-card-foreground ring-1 ring-border">
              {Object.entries(nomesRede).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="endereço do contrato"
              className="flex-1 rounded-lg bg-background px-3 py-2 font-mono text-xs text-card-foreground outline-none ring-1 ring-border placeholder:text-muted-foreground"
            />
            <button disabled={endereco.trim().length < 20 || analise.isPending} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40">
              {analise.isPending ? "Coletando dados…" : "Analisar"}
            </button>
          </form>
          {analise.isError && <p className="mt-2 text-xs text-danger">{analise.error?.message}</p>}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Não tem um token? Veja os <Link to="/lancamentos" className="text-signal underline">lançamentos ativos</Link>. Cada análise fica salva no <Link to="/historico" className="text-signal underline">histórico</Link>.
          </p>
        </div>
        {analise.data && <ResultadoAnalise analise={analise.data} />}
      </div>
    </Shell>
  );
}
