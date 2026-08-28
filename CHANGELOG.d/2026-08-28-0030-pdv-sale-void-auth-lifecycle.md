# PDV — estorno revalida a sessão ativa

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Identificado que `assets/pdv-sale-void.js` validava `owner/manager` apenas na inicialização; logout ou troca de funcionário na mesma aba podia deixar histórico de vendas, formulário de estorno e canal Realtime vinculados à sessão anterior até recarregar a página.
- O módulo agora acompanha `onAuthStateChange`, invalida a geração da sessão anterior, remove imediatamente a seção de vendas sensível, fecha formulários abertos e desconecta o canal Realtime antigo.
- A reativação só ocorre depois que o guard global termina e confirma novamente a mesma identidade autenticada, papel `owner/manager` e `padokaCanAccess('pdv')`.
- Leituras assíncronas de vendas/itens, reconciliação e a resposta da RPC `padoka_void_sale` passam a conferir `lifecycleEpoch`, `activeUserId` e a sessão atual antes de renderizar dados ou informar sucesso.
- A reconciliação autoritativa de falhas ambíguas foi preservada: sucesso só é mostrado quando `padoka_sales.status = 'voided'` é confirmado pelo servidor.
- `tests/pdv-sale-void-audit.mjs` foi ampliado para exigir limpeza de UI, remoção de Realtime, espera pelo guard de staff, permissão explícita ao PDV e descarte de respostas antigas após troca de identidade.
- Nenhum HTML/CSS, migration, RLS, grant ou Edge Function foi alterado. Nenhum objeto fora de `padoka_` e nenhum projeto InfoTech.io foram modificados.
