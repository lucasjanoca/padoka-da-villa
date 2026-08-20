-- PADOKA DA VILLA — operações internas: estoque, produção e perdas
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Esta migration não cria trigger em auth.users e mantém todos os objetos PADOKA isolados por prefixo padoka_.

create table if not exists public.padoka_inventory (
  product_id text primary key references public.padoka_products(id) on delete cascade,
  barcode text unique,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  min_quantity numeric(12,3) not null default 0 check (min_quantity >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.padoka_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.padoka_products(id) on delete restrict,
  delta numeric(12,3) not null check (delta <> 0),
  reason text not null check (char_length(trim(reason)) between 2 and 120),
  source text not null check (source in ('manual','sale','loss','production','adjustment')),
  reference_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.padoka_production_plans (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null default current_date,
  product_id text not null references public.padoka_products(id) on delete restrict,
  planned_quantity numeric(12,3) not null default 0 check (planned_quantity >= 0),
  produced_quantity numeric(12,3) not null default 0 check (produced_quantity >= 0),
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_date, product_id)
);

create table if not exists public.padoka_losses (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.padoka_products(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  reason text not null check (reason in ('Vencimento','Quebra / avaria','Sobra de produção','Erro de preparo','Outro')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.padoka_inventory(product_id)
select p.id from public.padoka_products p
on conflict (product_id) do nothing;

create or replace function public.padoka_staff_has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.padoka_staff_users s
    where s.user_id = auth.uid()
      and s.active = true
      and s.role = any(p_roles)
  );
$$;

create or replace function public.padoka_update_inventory_metadata(
  p_product_id text,
  p_barcode text default null,
  p_min_quantity numeric default 0
) returns public.padoka_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.padoka_inventory;
  v_barcode text;
begin
  if not public.padoka_staff_has_role(array['owner','manager','stock']) then
    raise exception 'padoka inventory permission required';
  end if;
  if not exists(select 1 from public.padoka_products p where p.id = p_product_id and p.active = true) then
    raise exception 'unknown or inactive product';
  end if;
  if p_min_quantity is null or p_min_quantity < 0 then raise exception 'invalid minimum inventory'; end if;

  v_barcode := nullif(trim(coalesce(p_barcode,'')),'');
  if v_barcode is not null and char_length(v_barcode) > 128 then raise exception 'barcode too long'; end if;

  insert into public.padoka_inventory(product_id,barcode,min_quantity,updated_by,updated_at)
  values(p_product_id,v_barcode,p_min_quantity,auth.uid(),now())
  on conflict (product_id) do update
  set barcode = excluded.barcode,
      min_quantity = excluded.min_quantity,
      updated_by = auth.uid(),
      updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.padoka_adjust_inventory(
  p_product_id text,
  p_delta numeric,
  p_reason text,
  p_source text default 'manual',
  p_reference_id uuid default null
) returns public.padoka_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.padoka_inventory;
begin
  if not public.padoka_staff_has_role(array['owner','manager','stock']) then
    raise exception 'padoka inventory permission required';
  end if;
  if p_delta is null or p_delta = 0 then raise exception 'inventory delta required'; end if;
  -- Ajustes feitos por esta RPC são somente manuais. Venda, perda e produção
  -- registram seus movimentos pelas próprias operações transacionais.
  if p_source not in ('manual','adjustment') then raise exception 'invalid manual inventory source'; end if;
  if p_reference_id is not null then raise exception 'manual inventory reference is not allowed'; end if;
  if char_length(trim(coalesce(p_reason,''))) not between 2 and 120 then raise exception 'invalid inventory reason'; end if;
  if not exists(select 1 from public.padoka_products p where p.id = p_product_id and p.active = true) then raise exception 'unknown or inactive product'; end if;

  insert into public.padoka_inventory(product_id,quantity,updated_by)
  values(p_product_id,0,auth.uid())
  on conflict (product_id) do nothing;

  update public.padoka_inventory
  set quantity = quantity + p_delta,
      updated_by = auth.uid(),
      updated_at = now()
  where product_id = p_product_id
    and quantity + p_delta >= 0
  returning * into v_row;

  if v_row.product_id is null then raise exception 'insufficient inventory'; end if;

  insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
  values(p_product_id,p_delta,trim(p_reason),p_source,null,auth.uid());

  return v_row;
end;
$$;

create or replace function public.padoka_register_loss(
  p_product_id text,
  p_quantity numeric,
  p_reason text,
  p_note text default null
) returns public.padoka_losses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loss public.padoka_losses;
  v_inventory public.padoka_inventory;
begin
  if not public.padoka_staff_has_role(array['owner','manager','stock','production']) then
    raise exception 'padoka loss permission required';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'loss quantity must be positive'; end if;
  if p_reason not in ('Vencimento','Quebra / avaria','Sobra de produção','Erro de preparo','Outro') then raise exception 'invalid loss reason'; end if;
  if char_length(coalesce(p_note,'')) > 500 then raise exception 'loss note too long'; end if;
  if not exists(select 1 from public.padoka_products p where p.id = p_product_id and p.active = true) then raise exception 'unknown or inactive product'; end if;

  update public.padoka_inventory
  set quantity = quantity - p_quantity,
      updated_by = auth.uid(),
      updated_at = now()
  where product_id = p_product_id
    and quantity - p_quantity >= 0
  returning * into v_inventory;

  if v_inventory.product_id is null then raise exception 'insufficient inventory'; end if;

  insert into public.padoka_losses(product_id,quantity,reason,note,created_by)
  values(p_product_id,p_quantity,p_reason,nullif(trim(coalesce(p_note,'')),''),auth.uid())
  returning * into v_loss;

  insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
  values(p_product_id,-p_quantity,'Perda: ' || p_reason,'loss',v_loss.id,auth.uid());

  return v_loss;
end;
$$;

create or replace function public.padoka_touch_operational_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.padoka_stamp_production_plan()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
    new.created_at = now();
    new.updated_at = now();
  else
    -- Campos de auditoria não são controlados pelo navegador.
    new.created_by = old.created_by;
    new.created_at = old.created_at;
    new.updated_by = auth.uid();
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists padoka_inventory_touch on public.padoka_inventory;
create trigger padoka_inventory_touch
before update on public.padoka_inventory
for each row execute function public.padoka_touch_operational_updated_at();

drop trigger if exists padoka_production_plans_touch on public.padoka_production_plans;
create trigger padoka_production_plans_touch
before insert or update on public.padoka_production_plans
for each row execute function public.padoka_stamp_production_plan();

alter table public.padoka_inventory enable row level security;
alter table public.padoka_inventory_movements enable row level security;
alter table public.padoka_production_plans enable row level security;
alter table public.padoka_losses enable row level security;

drop policy if exists "padoka staff read inventory" on public.padoka_inventory;
create policy "padoka staff read inventory" on public.padoka_inventory
for select to authenticated using (public.padoka_is_staff());

drop policy if exists "padoka staff read inventory movements" on public.padoka_inventory_movements;
create policy "padoka staff read inventory movements" on public.padoka_inventory_movements
for select to authenticated using (public.padoka_is_staff());

drop policy if exists "padoka staff read production" on public.padoka_production_plans;
create policy "padoka staff read production" on public.padoka_production_plans
for select to authenticated using (public.padoka_is_staff());

drop policy if exists "padoka production insert plans" on public.padoka_production_plans;
create policy "padoka production insert plans" on public.padoka_production_plans
for insert to authenticated
with check (public.padoka_staff_has_role(array['owner','manager','production']));

drop policy if exists "padoka production update plans" on public.padoka_production_plans;
create policy "padoka production update plans" on public.padoka_production_plans
for update to authenticated
using (public.padoka_staff_has_role(array['owner','manager','production']))
with check (public.padoka_staff_has_role(array['owner','manager','production']));

drop policy if exists "padoka staff read losses" on public.padoka_losses;
create policy "padoka staff read losses" on public.padoka_losses
for select to authenticated using (public.padoka_is_staff());

revoke all on public.padoka_inventory from anon;
revoke all on public.padoka_inventory_movements from anon;
revoke all on public.padoka_production_plans from anon;
revoke all on public.padoka_losses from anon;

-- Remove concessões amplas antes de reaplicar somente as operações necessárias.
revoke all on public.padoka_inventory from authenticated;
revoke all on public.padoka_inventory_movements from authenticated;
revoke all on public.padoka_production_plans from authenticated;
revoke all on public.padoka_losses from authenticated;

grant select on public.padoka_inventory to authenticated;
grant select on public.padoka_inventory_movements to authenticated;
grant select on public.padoka_production_plans to authenticated;
grant insert (plan_date,product_id,planned_quantity,produced_quantity,status,note) on public.padoka_production_plans to authenticated;
grant update (planned_quantity,produced_quantity,status,note) on public.padoka_production_plans to authenticated;
grant select on public.padoka_losses to authenticated;

revoke all on function public.padoka_staff_has_role(text[]) from public, anon;
grant execute on function public.padoka_staff_has_role(text[]) to authenticated;
revoke all on function public.padoka_update_inventory_metadata(text,text,numeric) from public, anon;
grant execute on function public.padoka_update_inventory_metadata(text,text,numeric) to authenticated;
revoke all on function public.padoka_adjust_inventory(text,numeric,text,text,uuid) from public, anon;
grant execute on function public.padoka_adjust_inventory(text,numeric,text,text,uuid) to authenticated;
revoke all on function public.padoka_register_loss(text,numeric,text,text) from public, anon;
grant execute on function public.padoka_register_loss(text,numeric,text,text) to authenticated;

create index if not exists padoka_inventory_barcode_idx on public.padoka_inventory(barcode) where barcode is not null;
create index if not exists padoka_inventory_movements_product_created_idx on public.padoka_inventory_movements(product_id,created_at desc);
create index if not exists padoka_production_plans_date_status_idx on public.padoka_production_plans(plan_date,status);
create index if not exists padoka_losses_created_idx on public.padoka_losses(created_at desc);