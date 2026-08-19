-- PADOKA DA VILLA
-- Schema preparado para o projeto Supabase correto da PADOKA.
-- NÃO aplicar no projeto InfoTech.io.

create table if not exists public.padoka_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  birthday date,
  marketing_opt_in boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.padoka_staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','cashier','attendant','production','stock')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.padoka_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'received' check (status in ('received','seen','confirmed','preparing','ready','completed','cancelled')),
  pickup_mode text not null check (pickup_mode in ('store','night')),
  pickup_date date not null,
  pickup_time time not null,
  pickup_name text not null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  payment_method text not null default 'pix',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','not_configured')),
  seen_at timestamptz,
  confirmed_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.padoka_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.padoka_orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.padoka_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.padoka_orders(id) on delete cascade,
  status text not null check (status in ('received','seen','confirmed','preparing','ready','completed','cancelled')),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.padoka_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.padoka_staff_users s
    where s.user_id = auth.uid() and s.active = true
  );
$$;

create or replace function public.padoka_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.padoka_order_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.padoka_order_events(order_id,status,actor_user_id)
    values (new.id,new.status,auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.padoka_order_events(order_id,status,actor_user_id)
    values (new.id,new.status,auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists padoka_profiles_touch on public.padoka_profiles;
create trigger padoka_profiles_touch before update on public.padoka_profiles
for each row execute function public.padoka_touch_updated_at();

drop trigger if exists padoka_orders_touch on public.padoka_orders;
create trigger padoka_orders_touch before update on public.padoka_orders
for each row execute function public.padoka_touch_updated_at();

drop trigger if exists padoka_order_events_trigger on public.padoka_orders;
create trigger padoka_order_events_trigger after insert or update of status on public.padoka_orders
for each row execute function public.padoka_order_event_trigger();

alter table public.padoka_profiles enable row level security;
alter table public.padoka_staff_users enable row level security;
alter table public.padoka_orders enable row level security;
alter table public.padoka_order_items enable row level security;
alter table public.padoka_order_events enable row level security;

drop policy if exists "padoka profile own read" on public.padoka_profiles;
create policy "padoka profile own read" on public.padoka_profiles for select to authenticated
using (id = auth.uid() or public.padoka_is_staff());

drop policy if exists "padoka profile own insert" on public.padoka_profiles;
create policy "padoka profile own insert" on public.padoka_profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "padoka profile own update" on public.padoka_profiles;
create policy "padoka profile own update" on public.padoka_profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "padoka staff self read" on public.padoka_staff_users;
create policy "padoka staff self read" on public.padoka_staff_users for select to authenticated
using (user_id = auth.uid() or public.padoka_is_staff());

drop policy if exists "padoka customers read own orders" on public.padoka_orders;
create policy "padoka customers read own orders" on public.padoka_orders for select to authenticated
using (customer_id = auth.uid() or public.padoka_is_staff());

drop policy if exists "padoka customers create own orders" on public.padoka_orders;
create policy "padoka customers create own orders" on public.padoka_orders for insert to authenticated
with check (customer_id = auth.uid());

drop policy if exists "padoka staff update orders" on public.padoka_orders;
create policy "padoka staff update orders" on public.padoka_orders for update to authenticated
using (public.padoka_is_staff()) with check (public.padoka_is_staff());

drop policy if exists "padoka read order items" on public.padoka_order_items;
create policy "padoka read order items" on public.padoka_order_items for select to authenticated
using (exists (select 1 from public.padoka_orders o where o.id = order_id and (o.customer_id = auth.uid() or public.padoka_is_staff())));

drop policy if exists "padoka create own order items" on public.padoka_order_items;
create policy "padoka create own order items" on public.padoka_order_items for insert to authenticated
with check (exists (select 1 from public.padoka_orders o where o.id = order_id and o.customer_id = auth.uid()));

drop policy if exists "padoka read order events" on public.padoka_order_events;
create policy "padoka read order events" on public.padoka_order_events for select to authenticated
using (exists (select 1 from public.padoka_orders o where o.id = order_id and (o.customer_id = auth.uid() or public.padoka_is_staff())));

create index if not exists padoka_orders_customer_created_idx on public.padoka_orders(customer_id, created_at desc);
create index if not exists padoka_orders_status_created_idx on public.padoka_orders(status, created_at desc);
create index if not exists padoka_order_items_order_idx on public.padoka_order_items(order_id);
create index if not exists padoka_order_events_order_idx on public.padoka_order_events(order_id, created_at);
