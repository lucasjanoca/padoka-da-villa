
-- Future-safe Data API defaults for PADOKA project.
revoke create on schema public from public;
revoke create on schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

alter default privileges in schema public
  revoke all on tables from anon, authenticated;

alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;
