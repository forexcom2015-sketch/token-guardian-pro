import { useCallback, useEffect, useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const REDES: Record<string, string> = {
  "0x1": "Ethereum",
  "0x38": "BNB Smart Chain",
  "0x2105": "Base",
  "0xaa36a7": "Sepolia",
};

function primeiraConta(value: unknown) {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
}

export function contaCurta(conta: string) {
  return `${conta.slice(0, 6)}…${conta.slice(-4)}`;
}

export function useMetaMask() {
  const [instalada, setInstalada] = useState<boolean | null>(null);
  const [conta, setConta] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lerRede = useCallback(async (provider: EthereumProvider) => {
    const value = await provider.request({ method: "eth_chainId" });
    setChainId(typeof value === "string" ? value : null);
  }, []);

  useEffect(() => {
    const provider = window.ethereum;
    setInstalada(Boolean(provider));
    if (!provider) return;

    const contasMudaram = (...args: unknown[]) => setConta(primeiraConta(args[0]));
    const redeMudou = (...args: unknown[]) => setChainId(typeof args[0] === "string" ? args[0] : null);
    provider.on?.("accountsChanged", contasMudaram);
    provider.on?.("chainChanged", redeMudou);
    void Promise.all([
      provider.request({ method: "eth_accounts" }).then((value) => setConta(primeiraConta(value))),
      lerRede(provider),
    ]).catch(() => setErro("Não foi possível consultar a MetaMask."));

    return () => {
      provider.removeListener?.("accountsChanged", contasMudaram);
      provider.removeListener?.("chainChanged", redeMudou);
    };
  }, [lerRede]);

  const conectar = useCallback(async () => {
    const provider = window.ethereum;
    if (!provider) return;
    setConectando(true);
    setErro(null);
    try {
      const contas = await provider.request({ method: "eth_requestAccounts" });
      setConta(primeiraConta(contas));
      await lerRede(provider);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Conexão cancelada ou indisponível.";
      setErro(mensagem.includes("User rejected") ? "A conexão foi cancelada na MetaMask." : mensagem);
    } finally {
      setConectando(false);
    }
  }, [lerRede]);

  const desconectar = useCallback(async () => {
    const provider = window.ethereum;
    setErro(null);
    try {
      await provider?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      // Some injected wallets do not support permission revocation; local state still disconnects.
    }
    setConta(null);
  }, []);

  return {
    instalada,
    conta,
    chainId,
    rede: chainId ? REDES[chainId] ?? `Rede ${Number.parseInt(chainId, 16)}` : null,
    conectando,
    erro,
    conectar,
    desconectar,
  };
}