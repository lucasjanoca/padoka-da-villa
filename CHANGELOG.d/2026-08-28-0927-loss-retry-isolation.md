# 2026-08-28 09:27 — Retry de perdas isolado por funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `162eadcf47b4f41bd1c2194a99e1bebce7fefa9c` antes da alteração.
- Confirmado que o `PADOKA Static Audit #396` e o GitHub Pages do HEAD anterior concluíram com sucesso.
- O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi acessado ou alterado.
- Identificado que `assets/loss-registration.js` ainda persistia a tentativa idempotente de perda em uma chave única de `sessionStorage`, embora o runtime já revalidasse sessão e papel interno.
- A tentativa pendente agora usa chave de armazenamento vinculada ao `user_id` do funcionário e carrega somente quando `userId` coincide com a identidade autenticada atual.
- Cada nova operação salva explicitamente o `userId`; antes de chamar `padoka_register_loss_once`, o frontend rejeita qualquer tentativa pendente que não pertença ao funcionário ativo.
- Logout ou troca de conta invalidam o estado pendente apenas em memória. Uma tentativa com resposta de rede ambígua permanece armazenada para o funcionário original, permitindo que ele volte e reutilize o mesmo `request_id` sem entregar os dados à próxima conta e sem criar um novo identificador por engano.
- A chave legada compartilhada `padoka_pending_loss_v1` é removida e não é restaurada, evitando reaproveitar dados sem vínculo de identidade.
- Respostas assíncronas continuam protegidas por `lifecycleEpoch`, mas agora também comparam a sessão atual ao `userId` capturado no início da operação, em vez de depender do valor mutável de `activeUserId`.
- `tests/loss-transaction-audit.mjs` passou a exigir isolamento do storage por identidade, vínculo `userId` na operação, preservação segura do retry ambíguo, descarte da chave legada e rejeição explícita de tentativa pertencente a outra conta.
- Nenhuma migration, RLS, grant, RPC, Edge Function ou secret foi alterado nesta execução; portanto não houve mudança de banco nem necessidade de Security Advisors.
