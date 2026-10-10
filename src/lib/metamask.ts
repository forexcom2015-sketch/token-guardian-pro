export type MetaMaskProvider = {
  isMetaMask?: boolean;
  providers?: MetaMaskProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (value: unknown) => void) => void;
  removeListener?: (event: string, listener: (value: unknown) => void) => void;
};

export type MetaMaskEventHandlers = {
  onAccountsChanged: (account: string | null) => void;
  onChainChanged: (chainId: string | null) => void;
  onDisconnect: () => void;
};

export function validarContaMetaMask(value: unknown): string | null {
  return Array.isArray(value) &&
    typeof value[0] === "string" &&
    /^0x[0-9a-f]{40}$/i.test(value[0])
    ? value[0]
    : null;
}

export function normalizarChainId(value: unknown): string | null {
  return typeof value === "string" && /^0x[0-9a-f]+$/i.test(value)
    ? value.toLowerCase()
    : null;
}

export function assinarEventosMetaMask(
  provider: MetaMaskProvider,
  handlers: MetaMaskEventHandlers,
): () => void {
  let ativo = true;
  const accountsChanged = (value: unknown) => {
    if (ativo) handlers.onAccountsChanged(validarContaMetaMask(value));
  };
  const chainChanged = (value: unknown) => {
    if (ativo) handlers.onChainChanged(normalizarChainId(value));
  };
  const disconnect = () => {
    if (ativo) handlers.onDisconnect();
  };

  provider.on?.("accountsChanged", accountsChanged);
  provider.on?.("chainChanged", chainChanged);
  provider.on?.("disconnect", disconnect);

  return () => {
    ativo = false;
    provider.removeListener?.("accountsChanged", accountsChanged);
    provider.removeListener?.("chainChanged", chainChanged);
    provider.removeListener?.("disconnect", disconnect);
  };
}
