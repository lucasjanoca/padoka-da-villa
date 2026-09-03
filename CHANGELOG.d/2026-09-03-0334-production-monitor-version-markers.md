# 2026-09-03 03:34 — Monitor de produção deixa de depender de versões antigas

- Investigada a falha do `PADOKA Production Monitor #27` separadamente do Static Audit, sem alterar runtime ou banco.
- A execução mostrou que Produto, Conta, Acompanhamento, Pagamento, PDV, assets locais, manifest, ícones, configuração pública, Push e verificações de segurança estavam respondendo corretamente; somente Home e Service Worker falharam por marcadores de versão obsoletos no próprio workflow.
- A Home publicada usa `assets/padoka-pwa.js?v=4`, enquanto o monitor ainda exigia `v=3`.
- O Service Worker atual usa cache `padoka-pwa-v8`, enquanto o monitor ainda exigia `padoka-pwa-v6`.
- O monitor agora valida marcadores estáveis/versionáveis (`assets/padoka-pwa.js?v=` e prefixo do nome de cache) em vez de congelar uma versão antiga.
- Foi adicionada uma checagem separada exigindo que o Service Worker publicado continue fixado em `https://yncspxfsvlqdnodlsosb.supabase.co`, preservando o isolamento do backend da PADOKA.
- Permaneceram intactos os checks de CSP, vendor lock, arquivos técnicos não publicados, autenticação do Push, limite de payload e endpoint público do projeto correto.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth, runtime de cliente ou objeto não-`padoka_` foi alterado.
