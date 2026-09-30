import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { supabase } from "@/integrations/supabase/client";
import { useUsuario } from "@/lib/historico";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Radar.IA" },
      { name: "description", content: "Entre para salvar suas análises de tokens na sua conta." },
      { property: "og:title", content: "Entrar — Radar.IA" },
      { property: "og:description", content: "Guarde o histórico do Radar IA entre sessões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { user } = useUsuario();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setMsg(null);
    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: `${window.location.origin}/historico` } });
    setCarregando(false);
    if (error) return setMsg(error.message);
    if (modo === "criar") return setMsg("Conta criada. Confirme pelo link enviado ao seu e-mail.");
    navigate({ to: "/historico" });
  }

  return (
    <Shell status={<span className="text-muted-foreground">Conta</span>}>
      <div className="mx-auto max-w-sm panel p-6">
        {user ? (
          <div className="space-y-4 text-sm">
            <p className="text-card-foreground">Conectado como {user.email}.</p>
            <button onClick={() => supabase.auth.signOut()} className="rounded-lg px-4 py-2 text-xs text-danger ring-1 ring-border">Sair</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3">
            <h1 className="text-xl font-semibold">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail" className="w-full rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-border" />
            <input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="senha" className="w-full rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-border" />
            <button disabled={carregando} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>
            {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
            <button type="button" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")} className="text-xs text-signal underline">
              {modo === "entrar" ? "Não tem conta? Criar" : "Já tenho conta"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}
