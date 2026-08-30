
revoke insert(product_id,plan_date,planned_quantity,produced_quantity,status,note)
  on table public.padoka_production_plans from authenticated;
revoke update(planned_quantity,produced_quantity,status,note)
  on table public.padoka_production_plans from authenticated;

drop policy if exists "padoka production insert plans" on public.padoka_production_plans;
drop policy if exists "padoka production update plans" on public.padoka_production_plans;
