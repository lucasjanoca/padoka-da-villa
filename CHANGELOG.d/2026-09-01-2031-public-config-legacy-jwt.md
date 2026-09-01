# 2026-09-01 20:31 — JWT público legado validado por papel

- O `PADOKA Static Audit` revelou que a proteção adicionada anteriormente em `assets/app-runtime.js` continha literalmente o nome de um papel administrativo, o que violava a auditoria global que proíbe essa referência no runtime público.
- A validação foi corrigida sem enfraquecer a proteção: chaves modernas continuam limitadas ao prefixo publishable e JWTs legados agora só são aceitos quando o payload decodificado declara `role = 'anon'`.
- `tests/public-config-hardening-audit.mjs` passou a exigir essa validação positiva de papel público e a ausência de referência a papel administrativo no runtime.
- Nenhum segredo foi adicionado, nenhum grant foi ampliado e nenhuma migration, RLS, policy, trigger, Edge Function ou configuração Google foi alterada.
- O backend continua fixado exclusivamente em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io e objetos não-`padoka_` permaneceram intocados.
