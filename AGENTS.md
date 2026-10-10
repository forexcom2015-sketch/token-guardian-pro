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

- Embed DexScreener charts directly from each token's market pair address with lazy-loaded iframes; this preserves the provider's live chart without inventing historical price data.
- Keep MetaMask connection in a browser-only shared header control using EIP-6963 discovery and injected-provider fallback; request account access only on user action and never initiate payments, signatures, or transactions as part of connection.
