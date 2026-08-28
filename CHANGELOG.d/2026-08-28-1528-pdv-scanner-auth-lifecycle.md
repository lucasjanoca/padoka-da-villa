# 2026-08-28 15:28 — Leitor do PDV isolado por lifecycle de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `a5a1bc1c6619fbe29544f35f97332040dd74eada` antes das alterações.
- O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto, migration, RLS, grant, secret ou Edge Function foi alterado nesta rodada e o projeto InfoTech.io não foi tocado.
- Identificada uma corrida no complemento do leitor físico do PDV: uma resposta atrasada de `padoka_list_product_barcodes` podia retornar depois de logout/troca de funcionário e ainda atualizar o cache local de códigos/renderização.
- `assets/pdv-scanner-fix.js` agora mantém `scannerLifecycleEpoch` + `scannerUserId`, acompanha `onAuthStateChange`, invalida buffers e códigos locais durante troca de identidade e só reativa o leitor depois de sessão atual, guard de staff e capability `pdv` serem novamente confirmados.
- A resposta da RPC de códigos é revalidada contra epoch, `user_id` e sessão atual antes de tocar em `products`, no status do leitor ou na renderização.
- A abertura da câmera também fica vinculada ao mesmo lifecycle; se a identidade mudar durante o refresh de códigos, a câmera não continua abrindo com o contexto anterior.
- `tests/pdv-hardware-scanner-audit.mjs` passou a exigir essas proteções e o cache-buster do loader foi atualizado para garantir que navegadores recebam a revisão nova.
- O comportamento de leitor USB/teclado, Tab/Enter, autoenvio por rajada, limite de tamanho, beep e distinção de códigos demonstrativos foi preservado.
