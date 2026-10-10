import { describe, expect, it, vi } from "vitest";
import {
  assinarEventosMetaMask,
  normalizarChainId,
  validarContaMetaMask,
  type MetaMaskProvider,
} from "./metamask";

const conta = "0x00000000000000000000000000000000000000a1";

function providerFalso() {
  const listeners = new Map<string, (value: unknown) => void>();
  const removidos: string[] = [];
  const provider: MetaMaskProvider = {
    request: vi.fn(async () => []),
    on: vi.fn((event, listener) => { listeners.set(event, listener); }),
    removeListener: vi.fn((event) => {
      removidos.push(event);
      listeners.delete(event);
    }),
  };
  return { provider, listeners, removidos };
}

describe("integração MetaMask", () => {
  it("valida contas EVM e rejeita respostas inválidas", () => {
    expect(validarContaMetaMask([conta])).toBe(conta);
    expect(validarContaMetaMask([])).toBeNull();
    expect(validarContaMetaMask(["0x123"])).toBeNull();
    expect(validarContaMetaMask(null)).toBeNull();
  });

  it("normaliza o identificador da rede e rejeita valores inválidos", () => {
    expect(normalizarChainId("0X89")).toBe("0x89");
    expect(normalizarChainId("0x2105")).toBe("0x2105");
    expect(normalizarChainId(137)).toBeNull();
    expect(normalizarChainId("polygon")).toBeNull();
  });

  it("propaga a troca de conta, a troca de rede e a desconexão", () => {
    const { provider, listeners } = providerFalso();
    const onAccountsChanged = vi.fn();
    const onChainChanged = vi.fn();
    const onDisconnect = vi.fn();

    assinarEventosMetaMask(provider, { onAccountsChanged, onChainChanged, onDisconnect });

    listeners.get("accountsChanged")?.([conta]);
    listeners.get("accountsChanged")?.([]);
    listeners.get("chainChanged")?.("0x89");
    listeners.get("disconnect")?.(undefined);

    expect(onAccountsChanged).toHaveBeenNthCalledWith(1, conta);
    expect(onAccountsChanged).toHaveBeenNthCalledWith(2, null);
    expect(onChainChanged).toHaveBeenCalledWith("0x89");
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("remove os listeners ao desmontar e ignora eventos posteriores", () => {
    const { provider, listeners, removidos } = providerFalso();
    const onAccountsChanged = vi.fn();
    const onChainChanged = vi.fn();
    const onDisconnect = vi.fn();
    const cleanup = assinarEventosMetaMask(provider, {
      onAccountsChanged,
      onChainChanged,
      onDisconnect,
    });
    const accountsListener = listeners.get("accountsChanged");

    cleanup();
    accountsListener?.([conta]);

    expect(removidos).toEqual(["accountsChanged", "chainChanged", "disconnect"]);
    expect(provider.removeListener).toHaveBeenCalledTimes(3);
    expect(onAccountsChanged).not.toHaveBeenCalled();
  });
});
