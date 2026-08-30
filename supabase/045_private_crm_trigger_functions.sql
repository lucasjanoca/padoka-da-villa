-- PADOKA DA VILLA — mover trigger functions privilegiadas de CRM para schema privado

alter function public.padoka_order_customer_notifications() set schema padoka_private;
revoke all on function padoka_private.padoka_order_customer_notifications() from public, anon, authenticated;
grant execute on function padoka_private.padoka_order_customer_notifications() to service_role;

alter function public.padoka_award_loyalty_on_real_order() set schema padoka_private;
revoke all on function padoka_private.padoka_award_loyalty_on_real_order() from public, anon, authenticated;
grant execute on function padoka_private.padoka_award_loyalty_on_real_order() to service_role;

-- Triggers keep their function OID when a function changes schema, so existing bindings remain intact.
