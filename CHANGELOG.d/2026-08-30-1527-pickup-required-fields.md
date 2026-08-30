## 2026-08-30 15:27 — Retirada exige data e horário completos antes de continuar

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual do repositório antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/pickup-validation.js` agora trata data vazia e horário vazio como estados inválidos explícitos, usando `setCustomValidity` e impedindo que o clique alcance o handler de continuação enquanto a retirada estiver incompleta.
- A validação de data passada e horário já passado no mesmo dia continua usando o fuso `America/Sao_Paulo` e não inventa regras de horário comercial.
- Quando uma seleção antiga expira enquanto a página ficou aberta/em segundo plano, o guard limpa os campos e recalcula imediatamente a validade nativa.
- `tests/pickup-validation-audit.mjs` passou a exigir data/horário obrigatórios no guard, as mensagens de validade correspondentes e a revalidação depois da limpeza de uma seleção expirada.
- A validação do checkout no servidor continua autoritativa; esta alteração é somente uma defesa/UX adicional no navegador e não amplia confiança no cliente.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve mudança de banco que exigisse nova consulta aos Security Advisors.
