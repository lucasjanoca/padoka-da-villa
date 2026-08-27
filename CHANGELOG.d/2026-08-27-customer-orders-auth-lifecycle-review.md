# 2026-08-27 — Revisão do ciclo de sessão em “Seus pedidos”

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes de continuar.
- Confirmado que `acompanhamento.html` já filtra `padoka_orders` pelo `customer_id` autenticado e mantém o Realtime restrito ao mesmo cliente.
- Identificado um risco de interface: a página ainda não reage a logout ou troca de sessão ocorridos em outra aba, então dados já renderizados podem permanecer visíveis até um reload mesmo com a RLS protegendo o backend.
- Aberta a Issue #3 com critérios fail-closed para remover o canal antigo, limpar estado renderizado e recarregar somente o novo `session.user.id` quando a autenticação mudar.
- A correção de runtime não foi aplicada nesta execução porque `acompanhamento.html` é um arquivo minificado e uma alteração ampla sem teste intermediário poderia quebrar o fluxo principal de acompanhamento; a alternativa segura foi delimitar a mudança e os testes necessários antes de editar.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado; não houve mudança de banco que exigisse advisor.
- O backend oficial permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
