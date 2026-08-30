create extension if not exists pg_net with schema extensions;

alter table public.padoka_customer_notifications
  add column if not exists push_dispatched_at timestamptz;

create table if not exists public.padoka_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint padoka_push_endpoint_length_chk check (char_length(endpoint) between 20 and 4096),
  constraint padoka_push_p256dh_length_chk check (char_length(p256dh) between 20 and 1024),
  constraint padoka_push_auth_length_chk check (char_length(auth_key) between 8 and 1024)
);

create index if not exists padoka_push_subscriptions_user_idx
  on public.padoka_push_subscriptions(user_id);

alter table public.padoka_push_subscriptions enable row level security;
revoke all on table public.padoka_push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.padoka_push_subscriptions to service_role;

create table if not exists public.padoka_push_config (
  id smallint primary key default 1 check (id = 1),
  vapid_public_key text not null,
  vapid_private_key text not null,
  vapid_subject text not null default 'https://lucasjanoca.github.io/padoka-da-villa/',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint padoka_push_public_key_length_chk check (char_length(vapid_public_key) between 80 and 100),
  constraint padoka_push_private_key_length_chk check (char_length(vapid_private_key) between 40 and 60)
);

alter table public.padoka_push_config enable row level security;
revoke all on table public.padoka_push_config from public, anon, authenticated;
grant select, insert, update, delete on table public.padoka_push_config to service_role;

create or replace function padoka_private.padoka_dispatch_customer_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-push',
    body := jsonb_build_object(
      'action', 'notification',
      'notification_id', new.id
    ),
    headers := jsonb_build_object(
      'content-type', 'application/json'
    ),
    timeout_milliseconds := 2000
  );
  return new;
exception
  when others then
    return new;
end;
$$;

revoke all on function padoka_private.padoka_dispatch_customer_push() from public, anon, authenticated;

drop trigger if exists padoka_customer_push_dispatch_trg on public.padoka_customer_notifications;
create trigger padoka_customer_push_dispatch_trg
after insert on public.padoka_customer_notifications
for each row
execute function padoka_private.padoka_dispatch_customer_push();
