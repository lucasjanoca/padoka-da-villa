-- PADOKA DA VILLA — keep privileged admin mutations RPC-only.
-- The browser roles already have no direct UPDATE grants on these tables;
-- remove the dormant RLS paths so a future grant cannot silently reopen them.

alter table public.padoka_feature_flags enable row level security;
alter table public.padoka_incidents enable row level security;
alter table public.padoka_privacy_requests enable row level security;

revoke update on table public.padoka_feature_flags from public, anon, authenticated;
revoke update on table public.padoka_incidents from public, anon, authenticated;
revoke update on table public.padoka_privacy_requests from public, anon, authenticated;

drop policy if exists padoka_feature_flags_admin_update on public.padoka_feature_flags;
drop policy if exists padoka_incidents_admin_update on public.padoka_incidents;
drop policy if exists padoka_privacy_owner_update on public.padoka_privacy_requests;
