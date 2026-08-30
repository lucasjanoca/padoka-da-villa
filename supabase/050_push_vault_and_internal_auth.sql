do $$
declare
  v_private text;
  v_id uuid;
begin
  select vapid_private_key
    into v_private
  from public.padoka_push_config
  where id = 1;

  if v_private is null or length(v_private) < 40 then
    raise exception 'padoka VAPID private key is missing';
  end if;

  select id into v_id
  from vault.decrypted_secrets
  where name = 'padoka_vapid_private_key'
  limit 1;

  if v_id is null then
    perform vault.create_secret(
      v_private,
      'padoka_vapid_private_key',
      'PADOKA Web Push VAPID private key'
    );
  else
    perform vault.update_secret(
      v_id,
      v_private,
      'padoka_vapid_private_key',
      'PADOKA Web Push VAPID private key'
    );
  end if;

  select id into v_id
  from vault.decrypted_secrets
  where name = 'padoka_push_webhook_secret'
  limit 1;

  if v_id is null then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'padoka_push_webhook_secret',
      'PADOKA internal database-to-edge push authentication'
    );
  end if;
end;
$$;

create or replace function public.padoka_get_push_server_config()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'vapid_private_key',
      (select decrypted_secret
       from vault.decrypted_secrets
       where name = 'padoka_vapid_private_key'
       limit 1),
    'webhook_secret',
      (select decrypted_secret
       from vault.decrypted_secrets
       where name = 'padoka_push_webhook_secret'
       limit 1)
  );
$$;

revoke all on function public.padoka_get_push_server_config()
  from public, anon, authenticated;
grant execute on function public.padoka_get_push_server_config()
  to service_role;

create or replace function padoka_private.padoka_dispatch_customer_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret
    into v_secret
  from vault.decrypted_secrets
  where name = 'padoka_push_webhook_secret'
  limit 1;

  if v_secret is null or length(v_secret) < 32 then
    return new;
  end if;

  perform net.http_post(
    url := 'https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-push',
    body := jsonb_build_object(
      'action', 'notification',
      'notification_id', new.id
    ),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-padoka-push-secret', v_secret
    ),
    timeout_milliseconds := 2000
  );

  return new;
exception
  when others then
    return new;
end;
$$;

revoke all on function padoka_private.padoka_dispatch_customer_push()
  from public, anon, authenticated;
