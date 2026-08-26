## 2026-08-26 — Estado do Google Auth corrigido

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Corrigida uma inconsistência documental que afirmava que o login Google já estava operacional.
- O estado oficial volta a registrar que Google é a opção principal planejada, mas ainda depende de **Client ID/Client Secret reais no Google Cloud** e de o provider ser habilitado no Supabase.
- Nenhuma credencial foi inventada ou adicionada ao repositório.
- Confirmado no frontend atual que `conta.html` já consulta o estado do provider, trata de forma amigável quando ele está desativado e preserva `prompt=select_account` quando o OAuth é iniciado.
- Login por e-mail/senha e link por e-mail continuam usando Supabase Auth real; nenhuma conta demo foi introduzida.
- Não houve alteração de banco, RLS, grants, triggers ou Edge Functions nesta execução; portanto não foi necessário executar advisor de banco.
- O projeto InfoTech.io não foi alterado.
