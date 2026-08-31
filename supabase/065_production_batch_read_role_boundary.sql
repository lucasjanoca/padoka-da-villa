-- PADOKA: production batch history is readable only by production-capable roles.
-- The browser uses this table to reconcile idempotent production attempts.

alter table public.padoka_production_batches enable row level security;

revoke all on public.padoka_production_batches from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.padoka_production_batches from authenticated;
grant select on public.padoka_production_batches to authenticated;

drop policy if exists "padoka staff read production batches" on public.padoka_production_batches;
drop policy if exists "padoka production roles read production batches" on public.padoka_production_batches;

create policy "padoka production roles read production batches"
on public.padoka_production_batches
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','production']::text[]))
);
