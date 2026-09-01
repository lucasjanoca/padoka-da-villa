# 2026-09-01 19:30 — Configuração pública validada em modo fail-closed

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- `assets/app-runtime.js` passou a exigir `scope = 'padoka'`, URL exatamente na raiz do backend PADOKA e formato de chave pública conhecido antes de aceitar ou persistir a configuração retornada pela Edge Function.
- O runtime rejeita explicitamente valores com prefixo `sb_secret_` ou indicação `service_role`, aceitando somente chave `sb_publishable_` ou o anon JWT legado enquanto esse fallback existir.
- A busca de `padoka-public-config` continua sem credenciais do navegador, agora também rejeita redirects e exige `Content-Type` JSON antes de interpretar a resposta.
- Criada `tests/public-config-hardening-audit.mjs` para impedir regressão do project ref, scope, URL, formato da chave, bloqueio de credenciais administrativas, redirects e contrato da Edge Function.
- Nenhuma migration, RLS, policy, grant, trigger ou configuração de Auth foi alterada nesta rodada; portanto nenhum privilégio de banco foi ampliado e não houve mudança de banco que exigisse consulta aos Security Advisors.
- Nenhuma credencial Google foi criada ou inventada; o provider Google continua dependendo das credenciais reais e da habilitação manual já documentadas.
