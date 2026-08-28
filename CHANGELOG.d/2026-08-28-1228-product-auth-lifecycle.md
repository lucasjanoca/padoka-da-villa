# 2026-08-28 12:28 — Catálogo interno isola lifecycle do funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `10c967892d053006d6b9e93a242ba93b1c7c88ec` antes das mudanças.
- Confirmado que o `PADOKA Static Audit #408` e o GitHub Pages concluíram com sucesso no estado anterior.
- Revisado `assets/product-management.js`: a gravação já era feita pela RPC `padoka_save_product`, com escrita direta em `padoka_products` revogada no desenho de banco, mas o módulo ainda mantinha `client/role` e respostas assíncronas sem lifecycle próprio após troca de funcionário.
- A gestão de catálogo agora acompanha `onAuthStateChange`, vincula o estado ao `activeUserId` e usa `lifecycleEpoch` para invalidar listagens e gravações iniciadas pela identidade anterior.
- Logout/troca de conta remove imediatamente os controles e dados em memória do catálogo anterior, encerra o canal Realtime associado e só remonta o módulo depois que sessão e papel `owner`/`manager` voltam a ser resolvidos pela navegação interna.
- Antes e depois de `padoka_save_product` e `padoka_list_products_admin`, a sessão é revalidada com `sessionStillMatches`; respostas atrasadas não continuam atualizando a interface depois de uma mudança de identidade.
- O canal Realtime passa a ser nomeado com o `user_id` validado e o canal anterior é removido antes de uma nova montagem.
- `tests/product-management-audit.mjs` foi ampliado para exigir lifecycle de autenticação, `activeUserId`, `lifecycleEpoch`, revalidação de sessão, limpeza dos controles e descarte do canal Realtime anterior.
- `AUTH_STATUS.md` foi atualizado para documentar o isolamento do catálogo interno por identidade.
- Nenhuma migration, RLS, grant, secret ou Edge Function foi alterada nesta rodada. O backend continua **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), e o projeto InfoTech.io não foi alterado.
