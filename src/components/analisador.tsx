import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { NivelPonto } from "@/components/shell";
import { analisarToken, type AnaliseToken } from "@/lib/token-ai.functions";

export function Analisador() {
  const fn = useServerFn(analisarToken);
  const [endereco, setEndereco] = useState("");
  const [rede, setRede] = useState("Ethereum");
  const [observacoes, setObservacoes] = useState("");

  const analise = useMutation<AnaliseToken, Error>({
    mutationFn: () => fn({ data: { endereco, rede, observacoes } }),
  });

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="label-eyebrow mb-3">Analisar contrato · checklist assistido por IA</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-background px-3 py-2 ring-1 ring-border">
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">0x</span>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="endereço do contrato"
              className="w-full bg-transparent font-mono text-xs text-card-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={rede}
            onChange={(e) => setRede(e.target.value)}
            className="rounded-lg bg-background px-3 py-2 text-xs text-card-foreground outline-none ring-1 ring-border"
          >
            {["Ethereum", "BNB Chain", "Solana", "Base", "Arbitrum", "Polygon"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          placeholder="Dados que você já levantou: lock de liquidez, top 10 wallets, taxas, holders, histórico do dev…"
          className="mt-2 w-full resize-none rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-card-foreground outline-none ring-1 ring-border placeholder:text-muted-foreground"
        />
        <button
          type="button"
          disabled={endereco.trim().length < 3 || analise.isPending}
          onClick={() => analise.mutate()}
          className="mt-3 rounded-lg bg-signal px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {analise.isPending ? "Analisando…" : "Analisar item a item"}
        </button>
        {analise.isError && <p className="mt-2 text-xs text-danger">{analise.error.message}</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          A IA não lê a blockchain ao vivo: ela organiza o checklist, interpreta o que você informou e
          aponta o que ainda precisa ser verificado no explorer.
        </p>
      </div>

      {analise.data && (
        <>
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="label-eyebrow mb-2">Leitura geral</div>
                <p className="text-pretty text-sm text-card-foreground">{analise.data.resumo}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-3xl text-card-foreground">{analise.data.score}</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <NivelPonto nivel={analise.data.nivelGeral} />
                  risco {analise.data.nivelGeral}
                </div>
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            {analise.data.itens.map((item) => (
              <div
                key={`${item.categoria}-${item.criterio}`}
                className="border-b border-border p-4 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <NivelPonto nivel={item.nivel} />
                  <span className="label-eyebrow">{item.categoria}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">
                    {item.nivel}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-card-foreground">{item.criterio}</p>
                <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {item.leitura}
                </p>
                <p className="mt-2 text-pretty text-xs leading-relaxed text-signal">
                  Como verificar: {item.comoVerificar}
                </p>
              </div>
            ))}
          </div>

          {analise.data.perguntasAbertas.length > 0 && (
            <div className="panel p-4">
              <div className="label-eyebrow mb-3">Ainda em aberto</div>
              <ul className="space-y-2">
                {analise.data.perguntasAbertas.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warn" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
