drop policy if exists padoka_push_subscriptions_deny_clients on public.padoka_push_subscriptions;
create policy padoka_push_subscriptions_deny_clients
on public.padoka_push_subscriptions
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists padoka_push_config_deny_clients on public.padoka_push_config;
create policy padoka_push_config_deny_clients
on public.padoka_push_config
for all
to anon, authenticated
using (false)
with check (false);
