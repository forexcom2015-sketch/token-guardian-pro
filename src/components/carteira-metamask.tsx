import { useEffect, useRef, useState } from "react";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Provider = {
  isMetaMask?: boolean;
  providers?: Provider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (value: unknown) => void) => void;
  removeListener?: (event: string, listener: (value: unknown) => void) => void;
};

const redes: Record<string, string> = {
  "0x1": "Ethereum", "0x38": "BNB Chain", "0x2105": "Base",
  "0x89": "Polygon", "0xa4b1": "Arbitrum", "0xa": "Optimism",
};

function contaValida(value: unknown): string | null {
  return Array.isArray(value) && typeof value[0] === "string" && /^0x[0-9a-f]{40}$/i.test(value[0]) ? value[0] : null;
}

export function CarteiraMetaMask() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [conta, setConta] = useState<string | null>(null);
  const [rede, setRede] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ausente, setAusente] = useState(false);
  const desligada = useRef(false);

  useEffect(() => {
    try { desligada.current = sessionStorage.getItem("metamask-desconectada") === "1"; } catch { /* Storage is optional. */ }
    const descobrir = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: { rdns?: string }; provider?: Provider }>).detail;
      if (detail?.info?.rdns === "io.metamask" && detail.provider?.request) {
        setProvider(detail.provider);
        setAusente(false);
      }
    };
    const legado = () => {
      const injected = (window as Window & { ethereum?: Provider }).ethereum;
      const metamask = injected?.providers?.find((p) => p.isMetaMask) ?? (injected?.isMetaMask ? injected : null);
      if (metamask) { setProvider((p) => p ?? metamask); setAusente(false); }
    };
    window.addEventListener("eip6963:announceProvider", descobrir);
    window.addEventListener("ethereum#initialized", legado);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    legado();
    return () => {
      window.removeEventListener("eip6963:announceProvider", descobrir);
      window.removeEventListener("ethereum#initialized", legado);
    };
  }, []);

  useEffect(() => {
    if (!provider) return;
    let ativo = true;
    const atualizarRede = (value: unknown) => { if (ativo) setRede(typeof value === "string" ? value.toLowerCase() : null); };
    const atualizarConta = (value: unknown) => { if (ativo && !desligada.current) setConta(contaValida(value)); };
    const desconectou = () => { if (ativo) { setConta(null); setRede(null); } };
    if (!desligada.current) {
      void provider.request({ method: "eth_accounts" }).then(atualizarConta).catch(() => {});
      void provider.request({ method: "eth_chainId" }).then(atualizarRede).catch(() => {});
    }
    provider.on?.("accountsChanged", atualizarConta);
    provider.on?.("chainChanged", atualizarRede);
    provider.on?.("disconnect", desconectou);
    return () => {
      ativo = false;
      provider.removeListener?.("accountsChanged", atualizarConta);
      provider.removeListener?.("chainChanged", atualizarRede);
      provider.removeListener?.("disconnect", desconectou);
    };
  }, [provider]);

  async function conectar() {
    setErro(null);
    if (!provider) { setAusente(true); return; }
    setOcupado(true);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const address = contaValida(accounts);
      if (!address) throw new Error("Nenhuma conta foi autorizada na MetaMask.");
      desligada.current = false;
      try { sessionStorage.removeItem("metamask-desconectada"); } catch { /* Storage is optional. */ }
      setConta(address);
      const chain = await provider.request({ method: "eth_chainId" }).catch(() => null);
      setRede(typeof chain === "string" ? chain.toLowerCase() : null);
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
      setErro(code === 4001 ? "Conexão recusada na MetaMask." : code === -32002 ? "Abra a MetaMask e conclua o pedido de conexão pendente." : "Não foi possível conectar. Abra a MetaMask e tente novamente.");
    } finally { setOcupado(false); }
  }

  async function desconectar() {
    if (!provider) return;
    setOcupado(true);
    desligada.current = true;
    try { sessionStorage.setItem("metamask-desconectada", "1"); } catch { /* Storage is optional. */ }
    setConta(null);
    setRede(null);
    setErro(null);
    try {
      await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      setErro("Desconectada deste site. Para revogar a permissão, remova o site nas conexões da MetaMask.");
    } finally { setOcupado(false); }
  }

  return (
    <div className="flex max-w-full flex-col items-end gap-1">
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
        {conta ? (
          <>
            <span className="text-[10px] text-muted-foreground">{rede ? redes[rede] ?? `Rede ${rede}` : "Rede indisponível"}</span>
            <span title={conta} className="font-mono text-xs text-signal">{conta.slice(0, 6)}…{conta.slice(-4)}</span>
            <Button variant="ghost" size="icon" onClick={desconectar} disabled={ocupado} title="Desconectar MetaMask" aria-label="Desconectar MetaMask">
              {ocupado ? <Loader2 className="animate-spin" /> : <LogOut />}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={conectar} disabled={ocupado}>
            {ocupado ? <Loader2 className="animate-spin" /> : <Wallet />}
            {ocupado ? "Conectando…" : "Conectar MetaMask"}
          </Button>
        )}
      </div>
      {ausente && !provider && <p role="status" className="max-w-72 text-right text-[11px] text-muted-foreground">MetaMask não encontrada. <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-signal hover:underline">Instalar MetaMask</a> ou abra este site no navegador da carteira.</p>}
      {erro && <p role="status" className="max-w-72 text-right text-[11px] text-warn">{erro}</p>}
    </div>
  );
}