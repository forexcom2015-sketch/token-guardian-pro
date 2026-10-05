import { describe, expect, it } from "vitest";
import { notaRisco, type Checagem } from "./onchain.server";

const checagem = (nivel: Checagem["nivel"], criterio = "Teste"): Checagem => ({
  categoria: "Teste",
  criterio,
  nivel,
  valor: "valor",
});

describe("notaRisco", () => {
  it("returns zero risk for an empty complete checklist", () => {
    const risco = notaRisco([], false);

    expect(risco.nota).toBe(0);
    expect(risco.nivel).toBe("baixo");
    expect(risco.cobertura).toBe("completa");
    expect(risco.desconhecidos).toBe(0);
  });

  it("scores high, medium and unknown signals deterministically", () => {
    const risco = notaRisco([
      checagem("alto", "Blacklist"),
      checagem("medio", "Liquidez"),
      checagem("desconhecido", "Ownership"),
    ], false);

    expect(risco.nota).toBe(25);
    expect(risco.nivel).toBe("medio");
    expect(risco.altos).toBe(1);
    expect(risco.medios).toBe(1);
    expect(risco.desconhecidos).toBe(1);
    expect(risco.cobertura).toBe("completa");
  });

  it("applies the critical-signal aggravator for honeypot, freeze or mint", () => {
    const risco = notaRisco([checagem("alto", "Honeypot")], false);

    expect(risco.nota).toBe(40);
    expect(risco.nivel).toBe("medio");
    expect(risco.alertas).toEqual(["Honeypot"]);
    expect(risco.itens.at(-1)?.criterio).toBe("Sinal crítico (honeypot/freeze/mint)");
  });

  it("marks security coverage as insufficient when the security source is unavailable", () => {
    const risco = notaRisco([checagem("baixo")], true);

    expect(risco.nota).toBe(50);
    expect(risco.nivel).toBe("alto");
    expect(risco.semSeguranca).toBe(true);
    expect(risco.cobertura).toBe("insuficiente");
    expect(risco.itens.at(-1)?.criterio).toBe("Sem checagem de segurança");
  });

  it("marks coverage as partial when multiple signals are unknown", () => {
    const risco = notaRisco([
      checagem("desconhecido", "A"),
      checagem("desconhecido", "B"),
      checagem("desconhecido", "C"),
    ], false);

    expect(risco.cobertura).toBe("parcial");
    expect(risco.nota).toBe(12);
  });

  it("caps the deterministic score at 100", () => {
    const risco = notaRisco(Array.from({ length: 20 }, () => checagem("alto")), false);

    expect(risco.nota).toBe(100);
    expect(risco.nivel).toBe("alto");
  });
});
