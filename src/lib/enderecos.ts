import { z } from "zod";
import type { Rede } from "./onchain.server";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function validarEnderecoToken(rede: Rede, endereco: string): boolean {
  return rede === "solana" ? SOLANA_ADDRESS.test(endereco) : EVM_ADDRESS.test(endereco);
}

export const enderecoSchema = z.string().trim().superRefine((endereco, ctx) => {
  if (!EVM_ADDRESS.test(endereco) && !SOLANA_ADDRESS.test(endereco)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Endereço de token inválido." });
  }
});

export const entradaTokenSchema = z.object({
  rede: z.enum(["solana", "bsc", "ethereum", "base"]),
  endereco: enderecoSchema,
}).superRefine((data, ctx) => {
  if (!validarEnderecoToken(data.rede, data.endereco)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endereco"],
      message: "O endereço não corresponde à rede selecionada.",
    });
  }
});
