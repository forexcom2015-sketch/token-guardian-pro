import { describe, expect, it } from "vitest";
import { entradaTokenSchema, validarEnderecoToken } from "./enderecos";

describe("validação de endereços", () => {
  it("accepts a valid EVM address on EVM networks", () => {
    const endereco = "0x0000000000000000000000000000000000000001";

    expect(validarEnderecoToken("ethereum", endereco)).toBe(true);
    expect(entradaTokenSchema.safeParse({ rede: "base", endereco }).success).toBe(true);
  });

  it("accepts a valid Solana address on Solana", () => {
    const endereco = "11111111111111111111111111111111";

    expect(validarEnderecoToken("solana", endereco)).toBe(true);
    expect(entradaTokenSchema.safeParse({ rede: "solana", endereco }).success).toBe(true);
  });

  it("rejects an EVM address on Solana", () => {
    const endereco = "0x0000000000000000000000000000000000000001";

    expect(validarEnderecoToken("solana", endereco)).toBe(false);
    expect(entradaTokenSchema.safeParse({ rede: "solana", endereco }).success).toBe(false);
  });

  it("rejects a Solana address on EVM networks", () => {
    const endereco = "11111111111111111111111111111111";

    expect(validarEnderecoToken("ethereum", endereco)).toBe(false);
    expect(entradaTokenSchema.safeParse({ rede: "ethereum", endereco }).success).toBe(false);
  });

  it("rejects malformed addresses before upstream calls", () => {
    expect(validarEnderecoToken("base", "0x123")).toBe(false);
    expect(validarEnderecoToken("solana", "0OIl")).toBe(false);
  });
});
