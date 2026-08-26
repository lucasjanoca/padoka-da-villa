-- PADOKA DA VILLA
-- Server-authoritative production planning after direct table writes were revoked.

create or replace function public.padoka_upsert_production_plan(
  p_plan_date date,
  p_product_id text,
  p_planned_quantity numeric,
  p_note text default null
)
returns public.padoka_production_plans
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_plan public.padoka_production_plans;
  v_note text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.padoka_staff_has_role(array['owner','manager','production']) then
    raise exception 'padoka production permission required';
  end if;

  if p_plan_date is null then
    raise exception 'production plan date required';
  end if;

  if p_product_id is null or btrim(p_product_id) = '' then
    raise exception 'production product required';
  end if;

  if p_planned_quantity is null or p_planned_quantity < 0 or p_planned_quantity > 1000000 then
    raise exception 'invalid planned quantity';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'production note too long';
  end if;

  if not exists (
    select 1
    from public.padoka_products p
    where p.id = p_product_id
      and p.active = true
  ) then
    raise exception 'unknown or inactive product';
  end if;

  insert into public.padoka_production_plans (
    plan_date,
    product_id,
    planned_quantity,
    note
  )
  values (
    p_plan_date,
    p_product_id,
    p_planned_quantity,
    v_note
  )
  on conflict (plan_date, product_id)
  do update set
    planned_quantity = excluded.planned_quantity,
    note = excluded.note
  returning * into v_plan;

  return v_plan;
end;
$$;

revoke all on function public.padoka_upsert_production_plan(date, text, numeric, text) from public;
revoke all on function public.padoka_upsert_production_plan(date, text, numeric, text) from anon;
grant execute on function public.padoka_upsert_production_plan(date, text, numeric, text) to authenticated;
