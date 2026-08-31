-- PADOKA: order status changes are server-authoritative through RPCs.
-- authenticated already has no direct UPDATE grant on padoka_orders; remove the
-- obsolete RLS UPDATE policy so a future grant cannot silently revive that path.

alter table public.padoka_orders enable row level security;

revoke update on public.padoka_orders from authenticated;
revoke update on public.padoka_orders from anon;

drop policy if exists "padoka_staff_update_orders" on public.padoka_orders;
