# Segurança — backend fixo na tela MFA

- A tela administrativa `mfa.html` deixou de criar o cliente Supabase diretamente a partir de `cfg.url`.
- A lógica de MFA foi movida para `assets/mfa.js`, permitindo `script-src 'self'` sem autorizar JavaScript inline nessa página sensível.
- O runtime fixa `https://yncspxfsvlqdnodlsosb.supabase.co` como única origem Supabase aceita e valida a configuração pública antes de inicializar o cliente.
- O fluxo continua exigindo staff ativo em `padoka_staff_users`, restringindo a etapa privilegiada a `owner`/`manager` e confirmando AAL2 por TOTP antes do retorno ao painel.
- `tests/mfa-security-audit.mjs` passou a cobrir o pinning do backend e impedir regressão para `createClient(cfg.url, ...)`.
- Nenhuma migration, policy, grant, Edge Function, credencial Google ou objeto não-`padoka_` foi alterado nesta rodada.
