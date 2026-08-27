## 2026-08-27 17:27 — Gestão de catálogo acompanha revalidação de staff

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/product-management.js`, `assets/internal-nav.css` e `tests/product-management-audit.mjs` antes da alteração.
- O backend já restringia `padoka_list_products_admin` e `padoka_save_product` a `owner/manager`, com escrita direta em `padoka_products` revogada para o navegador.
- Identificado um caso de troca de conta na mesma aba: depois de um `owner/manager` abrir **Gerenciar catálogo**, os controles podiam permanecer montados visualmente durante a revalidação para outro papel, embora a RPC ainda bloqueasse qualquer gravação não autorizada.
- `assets/internal-nav.css` agora oculta `#padokaProductAdmin` por padrão e só o revela quando `#padokaInternalNav` foi novamente validado com `data-staff-role="owner"` ou `data-staff-role="manager"`.
- Como `assets/internal-nav.js` remove o papel resolvido imediatamente em logout/troca de conta e só repõe `data-staff-role` depois da consulta real a `padoka_staff_users`, a interface administrativa do catálogo passa a falhar fechada também no aspecto visual.
- `tests/product-management-audit.mjs` foi ampliado para impedir regressão desse gate visual por papel.
- Nenhum HTML do catálogo público, preço, imagem, fluxo de checkout, banco, RLS, grant, Edge Function ou objeto não-`padoka_` foi alterado.
- O visual normal de `owner/manager` permanece o mesmo; a mudança só afeta estados de revalidação/troca de perfil.
