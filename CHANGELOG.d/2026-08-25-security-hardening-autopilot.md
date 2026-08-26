# Segurança: privilégios mínimos e checkout Pix endurecido

- Reativado o PADOKA Autopilot para continuar o projeto a cada hora com segurança como prioridade contínua.
- Reduzidos privilégios diretos dos papéis de navegador em tabelas sensíveis; leitura necessária foi preservada e escritas operacionais continuam pelas RPCs autorizadas.
- Mantido RLS ativo como defesa por linha e preservado o isolamento exclusivo dos objetos `padoka_` no projeto compartilhado.
- `padoka-pix-checkout` mantém `verify_jwt=true`, agora restringe chamadas de navegador à origem oficial atual, trata CORS/OPTIONS explicitamente, exige JSON, valida UUID de forma rigorosa e continua sem confiar em valor/status de pagamento enviados pelo cliente.
- Dependência `@supabase/supabase-js` da Edge Function fixada em versão específica para reduzir risco de alteração inesperada da cadeia de dependências.
- O adaptador real do provedor Pix continua fail-closed: nenhum pagamento é marcado como confirmado pelo navegador enquanto a integração oficial não estiver implementada.
