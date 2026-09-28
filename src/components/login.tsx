import { useState } from "react";
import { entrarGoogle, sair, useSessao } from "@/hooks/use-sessao";

export function BotaoGoogle({ texto = "Entrar com Google" }: { texto?: string }) {
  const [erro, setErro] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        onClick={() => entrarGoogle().catch((e: Error) => setErro(e.message))}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        {texto}
      </button>
      {erro && <span className="mt-1 text-[10px] text-danger">{erro}</span>}
    </span>
  );
}

export function ContaNav() {
  const { user, pronto } = useSessao();
  if (!pronto) return null;
  if (!user) return <BotaoGoogle />;
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="max-w-40 truncate">{user.email}</span>
      <button onClick={() => sair()} className="underline hover:text-card-foreground">Sair</button>
    </span>
  );
}

export function PedirLogin({ motivo }: { motivo: string }) {
  return (
    <div className="panel flex flex-wrap items-center gap-4 p-6 text-sm text-muted-foreground">
      <span className="flex-1">{motivo}</span>
      <BotaoGoogle />
    </div>
  );
}
