-- PADOKA DA VILLA — camada empresarial de observabilidade, feature flags e health metrics

create table if not exists public.padoka_feature_flags (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9_.-]{1,79}$'),
  enabled boolean not null default false,
  audience text not null default 'public' check (audience in ('public','staff')),
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  updated_by uuid null,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(config) = 'object')
);

alter table public.padoka_feature_flags enable row level security;
revoke all on table public.padoka_feature_flags from public, anon, authenticated;
grant select on table public.padoka_feature_flags to anon, authenticated;
grant update(enabled,description,config) on table public.padoka_feature_flags to authenticated;

drop policy if exists padoka_feature_flags_public_read on public.padoka_feature_flags;
create policy padoka_feature_flags_public_read
on public.padoka_feature_flags for select
to anon, authenticated
using (audience = 'public');

drop policy if exists padoka_feature_flags_staff_read on public.padoka_feature_flags;
create policy padoka_feature_flags_staff_read
on public.padoka_feature_flags for select
to authenticated
using (padoka_private.is_staff());

drop policy if exists padoka_feature_flags_admin_update on public.padoka_feature_flags;
create policy padoka_feature_flags_admin_update
on public.padoka_feature_flags for update
to authenticated
using (
  padoka_private.staff_has_role(array['owner','manager'])
  and coalesce(auth.jwt()->>'aal','aal1') = 'aal2'
)
with check (
  padoka_private.staff_has_role(array['owner','manager'])
  and coalesce(auth.jwt()->>'aal','aal1') = 'aal2'
);

create or replace function public.padoka_stamp_feature_flag()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
revoke all on function public.padoka_stamp_feature_flag() from public, anon, authenticated;

drop trigger if exists padoka_feature_flags_stamp_trg on public.padoka_feature_flags;
create trigger padoka_feature_flags_stamp_trg
before update on public.padoka_feature_flags
for each row execute function public.padoka_stamp_feature_flag();

insert into public.padoka_feature_flags(key,enabled,audience,description,config)
values
  ('telemetry',true,'public','Telemetria técnica sem PII para saúde, erros e Core Web Vitals','{"retention_days":90}'::jsonb),
  ('product_pages',true,'public','Páginas individuais de produto e recomendações','{}'::jsonb),
  ('loyalty',true,'public','Programa de fidelidade para pedidos reais concluídos','{"points_per_real":1}'::jsonb),
  ('coupons',false,'public','Cupons server-authoritative; manter desligado até catálogo real aprovado','{}'::jsonb),
  ('customer_notifications',true,'public','Central de notificações dentro da conta do cliente','{}'::jsonb),
  ('external_notifications',false,'staff','Integrações externas de WhatsApp/e-mail dependem de provedor e credenciais reais','{}'::jsonb),
  ('production_forecast',true,'staff','Previsão baseada em histórico real concluído','{"weeks":12}'::jsonb),
  ('merchant_seo',false,'staff','SEO comercial indexável só após catálogo real ser aprovado','{}'::jsonb),
  ('privacy_self_service',true,'public','Exportação de dados e solicitações de privacidade','{}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.padoka_client_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_name text not null check (event_name in (
    'page_view','product_view','add_to_cart','remove_from_cart',
    'checkout_start','checkout_review','checkout_submit','checkout_success',
    'auth_login','order_view','client_error','web_vital',
    'feature_exposure','reorder'
  )),
  page text not null check (char_length(page) between 1 and 160),
  metric_value numeric null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object'),
  check (octet_length(metadata::text) <= 4096)
);

create index if not exists padoka_client_events_created_idx
  on public.padoka_client_events(created_at desc);
create index if not exists padoka_client_events_event_created_idx
  on public.padoka_client_events(event_name,created_at desc);
create index if not exists padoka_client_events_session_created_idx
  on public.padoka_client_events(session_id,created_at desc);

alter table public.padoka_client_events enable row level security;
revoke all on table public.padoka_client_events from public, anon, authenticated;
grant select on table public.padoka_client_events to authenticated;
grant select,insert,update,delete on table public.padoka_client_events to service_role;
grant usage,select on sequence public.padoka_client_events_id_seq to service_role;

drop policy if exists padoka_client_events_admin_read on public.padoka_client_events;
create policy padoka_client_events_admin_read
on public.padoka_client_events for select
to authenticated
using (padoka_private.staff_has_role(array['owner','manager']));

create table if not exists public.padoka_incidents (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique check (fingerprint ~ '^[a-f0-9]{32,64}$'),
  severity text not null default 'error' check (severity in ('warning','error','critical')),
  status text not null default 'open' check (status in ('open','monitoring','resolved')),
  source text not null default 'browser' check (source in ('browser','edge','database','auth','realtime')),
  title text not null check (char_length(title) between 1 and 240),
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  sample jsonb not null default '{}'::jsonb,
  resolved_at timestamptz null,
  resolved_by uuid null
);

create index if not exists padoka_incidents_status_last_seen_idx
  on public.padoka_incidents(status,last_seen_at desc);

alter table public.padoka_incidents enable row level security;
revoke all on table public.padoka_incidents from public, anon, authenticated;
grant select on table public.padoka_incidents to authenticated;
grant update(status) on table public.padoka_incidents to authenticated;
grant select,insert,update,delete on table public.padoka_incidents to service_role;

drop policy if exists padoka_incidents_admin_read on public.padoka_incidents;
create policy padoka_incidents_admin_read
on public.padoka_incidents for select
to authenticated
using (padoka_private.staff_has_role(array['owner','manager']));

drop policy if exists padoka_incidents_admin_update on public.padoka_incidents;
create policy padoka_incidents_admin_update
on public.padoka_incidents for update
to authenticated
using (
  padoka_private.staff_has_role(array['owner','manager'])
  and coalesce(auth.jwt()->>'aal','aal1')='aal2'
)
with check (
  padoka_private.staff_has_role(array['owner','manager'])
  and coalesce(auth.jwt()->>'aal','aal1')='aal2'
);

create or replace function public.padoka_stamp_incident_resolution()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status='resolved' and old.status is distinct from 'resolved' then
    new.resolved_at := now();
    new.resolved_by := auth.uid();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
    new.resolved_by := null;
  end if;
  return new;
end;
$$;
revoke all on function public.padoka_stamp_incident_resolution() from public, anon, authenticated;

drop trigger if exists padoka_incidents_resolution_trg on public.padoka_incidents;
create trigger padoka_incidents_resolution_trg
before update of status on public.padoka_incidents
for each row execute function public.padoka_stamp_incident_resolution();

create or replace function public.padoka_enterprise_metrics(p_days integer default 7)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_days integer := greatest(1,least(coalesce(p_days,7),90));
  v_from timestamptz := now() - make_interval(days => greatest(1,least(coalesce(p_days,7),90)));
  v_result jsonb;
begin
  if not padoka_private.staff_has_role(array['owner','manager']) then
    raise exception 'permission denied' using errcode='42501';
  end if;

  select jsonb_build_object(
    'days',v_days,
    'page_views',count(*) filter (where e.event_name='page_view'),
    'sessions',count(distinct e.session_id),
    'errors',count(*) filter (where e.event_name='client_error'),
    'product_views',count(*) filter (where e.event_name='product_view'),
    'add_to_cart',count(*) filter (where e.event_name='add_to_cart'),
    'checkout_start',count(*) filter (where e.event_name='checkout_start'),
    'checkout_submit',count(*) filter (where e.event_name='checkout_submit'),
    'checkout_success',count(*) filter (where e.event_name='checkout_success'),
    'reorders',count(*) filter (where e.event_name='reorder'),
    'lcp_p75',(
      select round(percentile_cont(0.75) within group (order by x.metric_value)::numeric,0)
      from public.padoka_client_events x
      where x.created_at>=v_from and x.event_name='web_vital' and x.metadata->>'metric'='LCP' and x.metric_value is not null
    ),
    'inp_p75',(
      select round(percentile_cont(0.75) within group (order by x.metric_value)::numeric,0)
      from public.padoka_client_events x
      where x.created_at>=v_from and x.event_name='web_vital' and x.metadata->>'metric'='INP' and x.metric_value is not null
    ),
    'cls_p75',(
      select round(percentile_cont(0.75) within group (order by x.metric_value)::numeric,3)
      from public.padoka_client_events x
      where x.created_at>=v_from and x.event_name='web_vital' and x.metadata->>'metric'='CLS' and x.metric_value is not null
    )
  )
  into v_result
  from public.padoka_client_events e
  where e.created_at>=v_from;

  return coalesce(v_result,'{}'::jsonb);
end;
$$;
revoke all on function public.padoka_enterprise_metrics(integer) from public, anon;
grant execute on function public.padoka_enterprise_metrics(integer) to authenticated, service_role;

create or replace function public.padoka_health_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not padoka_private.staff_has_role(array['owner','manager']) then
    raise exception 'permission denied' using errcode='42501';
  end if;

  select jsonb_build_object(
    'open_incidents',(select count(*) from public.padoka_incidents i where i.status<>'resolved'),
    'errors_24h',(select count(*) from public.padoka_client_events e where e.event_name='client_error' and e.created_at>=now()-interval '24 hours'),
    'last_telemetry_at',(select max(e.created_at) from public.padoka_client_events e),
    'active_products',(select count(*) from public.padoka_products p where p.active),
    'demo_products',(select count(*) from public.padoka_products p where p.active and p.is_demo),
    'real_products',(select count(*) from public.padoka_products p where p.active and not p.is_demo),
    'low_stock',(select count(*) from public.padoka_inventory i where i.quantity<=i.min_quantity),
    'payment_provider_configured',(select coalesce(s.provider_configured,false) from public.padoka_payment_settings s where s.id=true),
    'payment_confirmation_required',(select coalesce(s.require_provider_confirmation,true) from public.padoka_payment_settings s where s.id=true)
  ) into v_result;

  return v_result;
end;
$$;
revoke all on function public.padoka_health_summary() from public, anon;
grant execute on function public.padoka_health_summary() to authenticated, service_role;
