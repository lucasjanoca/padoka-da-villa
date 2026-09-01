## 2026-09-01 06:27 — Área interna fixa o backend PADOKA

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `internal.html`, `assets/internal-nav.js` e as auditorias relacionadas antes da alteração.
- Confirmado que a PADOKA continua vinculada exclusivamente ao Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi acessado ou alterado.
- Identificado que `internal.html` ainda inicializa o client com a URL recebida pela configuração pública. Embora a CSP já restrinja conexões ao host PADOKA, a navegação interna agora adiciona uma segunda barreira explícita antes dessa inicialização.
- `assets/internal-nav.js` fixa `https://yncspxfsvlqdnodlsosb.supabase.co` como única origem Supabase aceita nas páginas internas. Qualquer tentativa de criar um client com outra origem falha de forma fechada antes de autenticação ou consulta operacional.
- O wrapper mantém a `publishableKey` e as opções normais do client, mas substitui a URL validada pela origem PADOKA constante. Nenhum `service_role`, `sb_secret_` ou segredo administrativo foi introduzido no navegador.
- Criada `tests/internal-backend-pinning-audit.mjs`, que exige a origem correta, o comportamento fail-closed, a instalação única do guard e a execução do guard antes do bootstrap inline de `internal.html`.
- Nenhuma migration, RLS, policy, grant, Edge Function ou configuração OAuth foi alterada nesta rodada; portanto não houve mudança de privilégios nem necessidade de tocar em objetos não-`padoka_`.
