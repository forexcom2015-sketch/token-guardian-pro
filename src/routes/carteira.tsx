import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, PlugZap, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { contaCurta, useMetaMask } from "@/lib/metamask";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Conectar MetaMask — Token Guardian IA" },
      { name: "description", content: "Conecte sua carteira MetaMask ao Token Guardian IA sem realizar transações." },
      { property: "og:title", content: "Conectar MetaMask — Token Guardian IA" },
      { property: "og:description", content: "Conexão segura de carteira MetaMask, sem Pix ou transações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Carteira,
});

function Carteira() {
  const metamask = useMetaMask();

  return (
    <Shell status={<span className="font-mono text-muted-foreground">CARTEIRA EVM</span>}>
      <section className="mx-auto max-w-2xl py-8">
        <div className="mb-8 border-b border-border pb-6">
          <p className="mb-2 font-mono text-[10px] uppercase text-signal">Conexão de carteira</p>
          <h1 className="text-3xl font-semibold text-foreground">MetaMask</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Conecte sua carteira para identificá-la no sistema. Nenhuma transação será solicitada.</p>
        </div>

        <div className="panel p-6">
          {metamask.instalada === null ? (
            <p className="text-sm text-muted-foreground">Verificando MetaMask…</p>
          ) : !metamask.instalada ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Wallet className="mt-0.5 size-6 text-warn" aria-hidden="true" />
                <div>
                  <h2 className="font-medium text-card-foreground">MetaMask não encontrada</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Instale a extensão oficial no navegador e volte a esta página.</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">Abrir site oficial <ExternalLink /></a>
              </Button>
            </div>
          ) : metamask.conta ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <span className="grid size-10 place-items-center rounded-full bg-signal/10 text-signal"><ShieldCheck /></span>
                <div>
                  <h2 className="font-medium text-card-foreground">Carteira conectada</h2>
                  <p className="text-xs text-signal">Conexão ativa</p>
                </div>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Endereço</dt><dd className="mt-1 font-mono text-card-foreground">{contaCurta(metamask.conta)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Rede atual</dt><dd className="mt-1 text-card-foreground">{metamask.rede ?? "Consultando…"}</dd></div>
              </dl>
              <Button type="button" variant="outline" onClick={metamask.desconectar}>Desconectar</Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><PlugZap /></span>
                <div>
                  <h2 className="font-medium text-card-foreground">Pronta para conectar</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A MetaMask abrirá para você escolher e autorizar uma conta.</p>
                </div>
              </div>
              <Button type="button" onClick={metamask.conectar} disabled={metamask.conectando}>
                <Wallet /> {metamask.conectando ? "Aguardando MetaMask…" : "Conectar MetaMask"}
              </Button>
            </div>
          )}
          {metamask.erro && <p role="alert" className="mt-4 border-t border-border pt-4 text-sm text-danger">{metamask.erro}</p>}
        </div>

        <div className="mt-5 flex items-start gap-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
          <p>O sistema apenas lê o endereço público e a rede selecionada. Não pede frase-semente, chave privada ou assinatura.</p>
        </div>
      </section>
    </Shell>
  );
}