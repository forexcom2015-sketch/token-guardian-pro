import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { cotacoesBrl, type Ativo } from "@/lib/dex.functions";
import { TAXA_COMPRA_BPS, VALOR_MINIMO_BRL, WHATSAPP_NUMERO } from "@/lib/dex-config";
import { calcularCompra, cotacaoValida, lerReais } from "@/lib/dex-calculo";
import { numeroWhatsappValido } from "@/lib/dex-whatsapp";

export const Route = createFileRoute("/dex")({
  head: () => ({
    meta: [
      { title: "Comprar USDT com Pix — Token Guardian IA" },
      {
        name: "description",
        content:
          "Veja a cotação, a taxa e quanto você recebe, e finalize a compra de USDT com Pix pelo atendimento no WhatsApp.",
      },
      { property: "og:title", content: "Comprar USDT com Pix — Token Guardian IA" },
      {
        property: "og:description",
        content:
          "Compre USDT com Pix: cotação, taxa de 3% e valor final antes de falar com o atendimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dex,
});

type Eth = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (e: string, f: (x: unknown) => void) => void;
  removeListener?: (e: string, f: (x: unknown) => void) => void;
};
const eth = () =>
  typeof window !== "undefined" ? (window as unknown as { ethereum?: Eth }).ethereum : undefined;

/** Redes onde o USDT é entregue (EVM, compatíveis com a MetaMask). */
const REDES_USDT = [
  { id: "0x38", nome: "BNB Chain (BEP-20)" },
  { id: "0x1", nome: "Ethereum (ERC-20)" },
  { id: "0x2105", nome: "Base" },
] as const;

/** Moedas exibidas só para consulta de preço: a compra aqui é apenas de USDT. */
const MOEDAS: { id: Ativo; nome: string }[] = [
  { id: "USDT", nome: "Tether" },
  { id: "BNB", nome: "BNB" },
  { id: "ETH", nome: "Ethereum" },
  { id: "SOL", nome: "Solana" },
];

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlCent = (c: number) => brl(c / 100);
const usdt = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Dex() {
  const fn = useServerFn(cotacoesBrl);
  const q = useQuery({ queryKey: ["cotacoes-brl"], queryFn: () => fn(), refetchInterval: 5_000 });
  const [conta, setConta] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [temMM, setTemMM] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [valor, setValor] = useState("100");
  const [redeId, setRedeId] = useState<string>(REDES_USDT[0].id);

  useEffect(() => {
    const e = eth();
    setTemMM(!!e);
    if (!e) return;
    e.request({ method: "eth_accounts" })
      .then((a) => setConta((a as string[])[0] ?? null))
      .catch(() => {});
    e.request({ method: "eth_chainId" })
      .then((c) => setChain(c as string))
      .catch(() => {});
    const onAcc = (a: unknown) => setConta((a as string[])[0] ?? null);
    const onChain = (c: unknown) => setChain(c as string);
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, []);

  // Ao conectar a MetaMask, sugere a rede em que ela está (se for uma das atendidas).
  useEffect(() => {
    if (chain && REDES_USDT.some((r) => r.id === chain)) setRedeId(chain);
  }, [chain]);

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

  const precoUsdt = cotacaoValida(q.data?.precos.USDT);
  const reais = lerReais(valor);
  const compra = calcularCompra(reais, precoUsdt);
  const rede = REDES_USDT.find((r) => r.id === redeId) ?? REDES_USDT[0];

  const link = compra && precoUsdt !== null ? "https://w.app/tokenguardianpro" : null;

  const atendimentoConfigurado = numeroWhatsappValido(WHATSAPP_NUMERO);
  const taxaPct = TAXA_COMPRA_BPS / 100;
  const valorInvalido = valor.trim() !== "" && !compra && precoUsdt !== null;

  return (
    <Shell
      status={
        <span className="font-mono text-muted-foreground">
          {q.isFetching ? "cotando…" : "Cotação em tempo real • atualização ~5s"}
        </span>
      }
    >
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Pix → USDT</div>
        <h1 className="text-2xl font-semibold">Comprar USDT</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Veja quanto você paga e quanto recebe. O pagamento por Pix e a entrega do USDT são feitos
          no atendimento pelo WhatsApp.
        </p>
      </div>

      {!atendimentoConfigurado && (
        <div className="mb-6 rounded-md border border-warn/40 p-3 text-xs text-warn">
          Atendimento no WhatsApp ainda não configurado: o botão de compra fica desativado até o
          número ser informado.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="panel space-y-5 p-5">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">
              Quanto você quer pagar com Pix (R$, mínimo {VALOR_MINIMO_BRL})
            </span>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-lg"
            />
            {valorInvalido && (
              <span className="mt-1 block text-[11px] text-danger">
                Informe um valor a partir de {brl(VALOR_MINIMO_BRL)}.
              </span>
            )}
          </label>

          <div className="rounded-md border border-border bg-background p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cotação ao vivo (1 USDT)</dt>
                <dd className="font-mono">
                  {precoUsdt ? brl(precoUsdt) : q.isError ? "indisponível" : "…"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Você paga</dt>
                <dd className="font-mono">{compra ? brlCent(compra.pagoCent) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Taxa ({taxaPct}%)</dt>
                <dd className="font-mono">{compra ? `− ${brlCent(compra.taxaCent)}` : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Valor convertido em USDT</dt>
                <dd className="font-mono">{compra ? brlCent(compra.liquidoCent) : "—"}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <div className="text-xs text-muted-foreground">Você recebe</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-signal">
                {compra ? `${usdt(compra.usdtCent)} USDT` : "—"}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">
              Rede para receber o USDT
            </span>
            <select
              value={redeId}
              onChange={(e) => setRedeId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {REDES_USDT.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-muted-foreground">
            Carteira:{" "}
            {conta ? (
              <span className="break-all font-mono text-card-foreground">{conta}</span>
            ) : (
              "conecte a MetaMask ao lado para enviar o endereço automaticamente, ou informe no atendimento."
            )}
          </p>

          {link ? (
            <a
              href={link}
              className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Comprar
            </a>
          ) : (
            <button
              disabled
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground opacity-40"
            >
              Comprar
            </button>
          )}

          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>
              A cotação é uma referência: o valor final é confirmado no atendimento antes de
              qualquer pagamento.
            </p>
            <p className="text-warn">
              Nunca informe sua frase de recuperação (seed) nem sua senha a ninguém, nem ao
              atendimento. Confira sempre o número oficial.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel h-fit space-y-3 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Cotações em R$</h2>
            <ul className="space-y-2 text-sm">
              {MOEDAS.map((m) => {
                const p = q.data?.precos[m.id] ?? null;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3">
                    <span>
                      <span className="font-medium text-card-foreground">{m.id}</span>{" "}
                      <span className="text-xs text-muted-foreground">{m.nome}</span>
                    </span>
                    <span className="font-mono text-xs">
                      {p ? brl(p) : q.isError ? "indisponível" : "…"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Aqui você compra apenas USDT. Depois, na sua carteira, use a função de troca (Swap)
              para converter o USDT em qualquer outra cripto. USDT/BRL: Binance (tempo real). Demais ativos: CoinGecko.
            </p>
          </div>

          <div className="panel h-fit space-y-3 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Carteira MetaMask</h2>
            {conta ? (
              <>
                <div className="text-xs text-muted-foreground">Conectada</div>
                <div className="break-all font-mono text-xs text-card-foreground">{conta}</div>
                <div className="text-xs text-muted-foreground">
                  Rede atual:{" "}
                  {chain
                    ? (REDES_USDT.find((r) => r.id === chain)?.nome ?? `outra (${chain})`)
                    : "—"}
                </div>
              </>
            ) : (
              <button
                onClick={conectar}
                className="w-full rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                Conectar MetaMask
              </button>
            )}
            {!temMM && (
              <p className="text-[11px] text-muted-foreground">
                Não detectamos a MetaMask.{" "}
                <a
                  className="text-signal underline"
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instalar
                </a>
              </p>
            )}
            {erro && <p className="text-[11px] text-danger">{erro}</p>}
            <p className="text-[11px] text-muted-foreground">
              Conectar só mostra o seu endereço para o pedido. O site nunca envia transações nem
              pede suas chaves.
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
