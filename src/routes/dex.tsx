import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { cotacoesBrl, type Ativo } from "@/lib/dex.functions";

export const Route = createFileRoute("/dex")({
  head: () => ({
    meta: [
      { title: "DEX Pix → Cripto — Token Guardian IA" },
      { name: "description", content: "Conecte a MetaMask e simule a troca de Pix por USDT, SOL, BNB ou ETH com cotações ao vivo." },
      { property: "og:title", content: "DEX Pix → Cripto — Token Guardian IA" },
      { property: "og:description", content: "Simulação de compra de USDT, SOL, BNB e ETH com Pix e carteira MetaMask." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dex,
});

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (e: string, f: (x: unknown) => void) => void; removeListener?: (e: string, f: (x: unknown) => void) => void };
const eth = () => (typeof window !== "undefined" ? (window as unknown as { ethereum?: Eth }).ethereum : undefined);

const REDES_EVM: Record<string, string> = { "0x1": "Ethereum", "0x38": "BNB Chain", "0x2105": "Base" };
const ATIVOS: { id: Ativo; rede: string }[] = [
  { id: "USDT", rede: "BNB Chain / Ethereum" },
  { id: "BNB", rede: "BNB Chain" },
  { id: "ETH", rede: "Ethereum" },
  { id: "SOL", rede: "Solana" },
];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Dex() {
  const fn = useServerFn(cotacoesBrl);
  const q = useQuery({ queryKey: ["cotacoes-brl"], queryFn: () => fn(), refetchInterval: 30_000 });
  const [conta, setConta] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [temMM, setTemMM] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ativo, setAtivo] = useState<Ativo>("USDT");
  const [valor, setValor] = useState("100");
  const [solDestino, setSolDestino] = useState("");
  const [pedido, setPedido] = useState<string | null>(null);

  useEffect(() => {
    const e = eth();
    setTemMM(!!e);
    if (!e) return;
    e.request({ method: "eth_accounts" }).then((a) => setConta((a as string[])[0] ?? null)).catch(() => {});
    e.request({ method: "eth_chainId" }).then((c) => setChain(c as string)).catch(() => {});
    const onAcc = (a: unknown) => setConta((a as string[])[0] ?? null);
    const onChain = (c: unknown) => setChain(c as string);
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => { e.removeListener?.("accountsChanged", onAcc); e.removeListener?.("chainChanged", onChain); };
  }, []);

  async function conectar() {
    setErro(null);
    const e = eth();
    if (!e) return setErro("MetaMask não encontrada neste navegador.");
    try {
      const a = (await e.request({ method: "eth_requestAccounts" })) as string[];
      setConta(a[0] ?? null);
      setChain((await e.request({ method: "eth_chainId" })) as string);
    } catch {
      setErro("Conexão recusada na MetaMask.");
    }
  }

  const preco = q.data?.precos[ativo] ?? null;
  const reais = Number(valor.replace(",", "."));
  const recebe = preco && reais > 0 ? reais / preco : 0;
  const solOk = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solDestino.trim());
  const destino = ativo === "SOL" ? (solOk ? solDestino.trim() : null) : conta;
  const pode = !!destino && reais >= 10 && recebe > 0;

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{q.isFetching ? "cotando…" : "Cotação a cada 30s"}</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Pix → Cripto</div>
        <h1 className="text-2xl font-semibold">DEX</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Compre USDT, BNB, ETH ou SOL pagando com Pix. Cotações reais; a compra ainda é uma simulação.</p>
      </div>

      <div className="mb-6 rounded-md border border-warn/40 p-3 text-xs text-warn">
        Modo simulação: nenhum Pix é cobrado e nenhuma cripto é enviada.
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="panel space-y-5 p-5">
          <div>
            <div className="mb-2 text-xs text-muted-foreground">Você recebe</div>
            <div className="flex flex-wrap gap-2">
              {ATIVOS.map((a) => (
                <button key={a.id} onClick={() => { setAtivo(a.id); setPedido(null); }}
                  className={`rounded-md px-4 py-2 text-xs ring-1 ring-border ${ativo === a.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {a.id} <span className="opacity-70">· {a.rede}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Valor em Pix (R$, mínimo 10)</span>
            <input value={valor} onChange={(e) => { setValor(e.target.value); setPedido(null); }} inputMode="decimal"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-lg" />
          </label>

          <div className="rounded-md border border-border bg-background p-4">
            <div className="text-xs text-muted-foreground">Estimativa a receber</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-signal">{recebe ? recebe.toLocaleString("pt-BR", { maximumFractionDigits: 6 }) : "—"} {ativo}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">1 {ativo} ≈ {preco ? brl(preco) : q.isError ? "cotação indisponível" : "…"} · fonte CoinGecko · sem taxas na simulação</div>
          </div>

          {ativo === "SOL" ? (
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Endereço Solana que vai receber</span>
              <input value={solDestino} onChange={(e) => setSolDestino(e.target.value)} placeholder="Ex.: 7xKX…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
              {solDestino && !solOk && <span className="mt-1 block text-[11px] text-danger">Endereço Solana inválido.</span>}
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">Destino: {conta ? <span className="font-mono text-card-foreground">{conta}</span> : "conecte a MetaMask ao lado."}</p>
          )}

          <button disabled={!pode} onClick={() => setPedido(`SIM-${Date.now().toString(36).toUpperCase()}`)}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
            Gerar Pix (simulação)
          </button>

          {pedido && (
            <div className="rounded-md border border-signal/40 p-4 text-xs">
              <div className="font-semibold text-signal">Pedido {pedido} criado (simulado)</div>
              <p className="mt-1 text-muted-foreground">Pagar {brl(reais)} via Pix → receber ≈ {recebe.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} {ativo} em</p>
              <p className="mt-1 break-all font-mono text-card-foreground">{destino}</p>
              <p className="mt-2 text-muted-foreground">Quando um parceiro de pagamento for conectado, aqui aparecerá o QR Code Pix real.</p>
            </div>
          )}
        </section>

        <aside className="panel h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Carteira MetaMask</h2>
          {conta ? (
            <>
              <div className="text-xs text-muted-foreground">Conectada</div>
              <div className="break-all font-mono text-xs text-card-foreground">{conta}</div>
              <div className="text-xs text-muted-foreground">Rede: {chain ? REDES_EVM[chain] ?? `outra (${chain})` : "—"}</div>
            </>
          ) : (
            <button onClick={conectar} className="w-full rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Conectar MetaMask</button>
          )}
          {!temMM && <p className="text-[11px] text-muted-foreground">Não detectamos a MetaMask. <a className="text-signal underline" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Instalar</a></p>}
          {erro && <p className="text-[11px] text-danger">{erro}</p>}
          <p className="text-[11px] text-muted-foreground">Para SOL, a MetaMask não é usada: informe o endereço Solana de destino.</p>
        </aside>
      </div>
    </Shell>
  );
}
