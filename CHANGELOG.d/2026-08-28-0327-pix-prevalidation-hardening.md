## 2026-08-28 03:27 — Pré-validação do Pix automático endurecida

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado que a `main` atual ainda mantém Pix manual/provisório enquanto o adaptador de banco/provedor real não foi escolhido/configurado.
- `supabase/functions/padoka-pix-checkout/index.ts` continua fail-closed sem provider real e agora também exige explicitamente `require_provider_confirmation = true` antes de qualquer futura criação de cobrança.
- Pedidos cujo `payment_status` já esteja em `paid`, `paid_late` ou `refunded` são recusados antes do adaptador, evitando uma segunda cobrança automática sobre pagamento já finalizado.
- O total usado para a futura cobrança continua vindo exclusivamente de `padoka_orders` e agora é validado como número finito e maior que zero antes do adaptador.
- Nenhum `amount`, `txid`, `paid` ou `payment_status` enviado pelo navegador ganhou autoridade; a Edge Function continua aceitando do cliente apenas o `order_id` e valida a propriedade do pedido pela sessão real.
- `tests/pix-edge-security-audit.mjs` foi ampliado para impedir regressão dessas garantias, além das verificações já existentes de JWT, CORS restrito, dependência fixada e isolamento `padoka_*`.
- Nenhuma migration, RLS, grant, secret, credencial financeira ou objeto de outro sistema foi alterado nesta rodada. O projeto InfoTech.io não foi tocado.
- A confirmação automática continua bloqueada até existir um adaptador real de banco/provedor com webhook autenticado; nenhuma credencial foi inventada.
