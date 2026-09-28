<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Histórico de análises fica na tabela `analises` (RLS por usuário, login só Google), lido pelo cliente do navegador — permite ver em qualquer aparelho.
- Cotação ao vivo vem do GeckoTerminal via server fn `cotacoesAoVivo`, com polling de 20 s no cliente — API gratuita, sem chave, cobre pools DEX de tokens novos.
