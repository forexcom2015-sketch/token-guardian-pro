import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

function Relogio() {
  const [hora, setHora] = useState("--:--");
  useEffect(() => {
    const atualizar = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }));
    atualizar();
    const id = setInterval(atualizar, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span>{hora} UTC</span>;
}

const navItens = [
  { to: "/painel", rotulo: "Painel" },
  { to: "/lancamentos", rotulo: "Lançamentos" },
  { to: "/pre-lancamentos", rotulo: "Pré-lançamentos" },
  { to: "/desempenho", rotulo: "Top desempenho" },
  { to: "/radar", rotulo: "Radar IA" },
  { to: "/historico", rotulo: "Histórico local" },
] as const;

export function Shell({ status, children }: { status: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-8 items-center gap-6 border-b border-border bg-card px-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="font-medium text-signal">Análise pública</span>
        <span className="ml-auto font-mono"><Relogio /></span>
        <span>Dados de mercado ao vivo</span>
      </div>
      <header className="flex flex-wrap items-center gap-6 border-b border-border bg-card/80 px-6 py-3">
        <Link to="/" className="font-mono text-sm font-semibold tracking-tight text-card-foreground">
          Token Guardian<span className="text-signal">.IA</span>
        </Link>
        <nav className="flex flex-wrap gap-5 text-xs text-muted-foreground">
          {navItens.map((item) => (
            <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-signal font-medium" }}
              className="transition-colors hover:text-card-foreground">
              {item.rotulo}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs">{status}</div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
      <footer className="flex flex-wrap items-center gap-4 border-t border-border bg-card px-6 py-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Token Guardian · análise pública de risco</span>
        <span className="ml-auto">Informativo — não é recomendação financeira</span>
      </footer>
    </div>
  );
}

export function NivelPonto({ nivel }: { nivel: string }) {
  const cor =
    nivel === "baixo" ? "bg-signal" :
    nivel === "medio" ? "bg-warn" :
    nivel === "alto" ? "bg-danger" : "bg-muted-foreground";
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${cor}`} />;
}
