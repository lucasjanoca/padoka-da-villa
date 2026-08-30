-- PADOKA DA VILLA — remover SECURITY DEFINER da superfície pública de RPC
-- A implementação privilegiada é movida para padoka_private. O nome/assinatura pública
-- permanece igual como wrapper SECURITY INVOKER, preservando compatibilidade do frontend.

alter function public.padoka_accept_verified_late_payment(uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_accept_verified_late_payment(uuid) from public, anon;
grant execute on function padoka_private.padoka_accept_verified_late_payment(uuid) to authenticated, service_role;

create function public.padoka_accept_verified_late_payment(p_order_id uuid)
returns public.padoka_orders
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_accept_verified_late_payment(p_order_id);
$$;
revoke all on function public.padoka_accept_verified_late_payment(uuid) from public, anon;
grant execute on function public.padoka_accept_verified_late_payment(uuid) to authenticated, service_role;

alter function public.padoka_add_staff_by_email(text, text) set schema padoka_private;
revoke all on function padoka_private.padoka_add_staff_by_email(text, text) from public, anon;
grant execute on function padoka_private.padoka_add_staff_by_email(text, text) to authenticated, service_role;

create function public.padoka_add_staff_by_email(p_email text, p_role text)
returns public.padoka_staff_users
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_add_staff_by_email(p_email,p_role);
$$;
revoke all on function public.padoka_add_staff_by_email(text, text) from public, anon;
grant execute on function public.padoka_add_staff_by_email(text, text) to authenticated, service_role;

alter function public.padoka_adjust_inventory_once(text, numeric, text, uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_adjust_inventory_once(text, numeric, text, uuid) from public, anon;
grant execute on function padoka_private.padoka_adjust_inventory_once(text, numeric, text, uuid) to authenticated, service_role;

create function public.padoka_adjust_inventory_once(p_product_id text, p_delta numeric, p_reason text, p_request_id uuid)
returns public.padoka_inventory
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_adjust_inventory_once(p_product_id,p_delta,p_reason,p_request_id);
$$;
revoke all on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) from public, anon;
grant execute on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) to authenticated, service_role;

alter function public.padoka_confirm_manual_pix(uuid, text) set schema padoka_private;
revoke all on function padoka_private.padoka_confirm_manual_pix(uuid, text) from public, anon;
grant execute on function padoka_private.padoka_confirm_manual_pix(uuid, text) to authenticated, service_role;

create function public.padoka_confirm_manual_pix(p_order_id uuid, p_bank_reference text)
returns public.padoka_orders
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_confirm_manual_pix(p_order_id,p_bank_reference);
$$;
revoke all on function public.padoka_confirm_manual_pix(uuid, text) from public, anon;
grant execute on function public.padoka_confirm_manual_pix(uuid, text) to authenticated, service_role;

alter function public.padoka_create_order_once(uuid, text, date, time without time zone, text, jsonb) set schema padoka_private;
revoke all on function padoka_private.padoka_create_order_once(uuid, text, date, time without time zone, text, jsonb) from public, anon;
grant execute on function padoka_private.padoka_create_order_once(uuid, text, date, time without time zone, text, jsonb) to authenticated, service_role;

create function public.padoka_create_order_once(p_request_id uuid, p_pickup_mode text, p_pickup_date date, p_pickup_time time without time zone, p_pickup_name text, p_items jsonb)
returns public.padoka_orders
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_create_order_once(p_request_id,p_pickup_mode,p_pickup_date,p_pickup_time,p_pickup_name,p_items);
$$;
revoke all on function public.padoka_create_order_once(uuid, text, date, time without time zone, text, jsonb) from public, anon;
grant execute on function public.padoka_create_order_once(uuid, text, date, time without time zone, text, jsonb) to authenticated, service_role;

alter function public.padoka_create_sale_once(jsonb, text, uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_create_sale_once(jsonb, text, uuid) from public, anon;
grant execute on function padoka_private.padoka_create_sale_once(jsonb, text, uuid) to authenticated, service_role;

create function public.padoka_create_sale_once(p_items jsonb, p_payment_method text, p_request_id uuid)
returns public.padoka_sales
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_create_sale_once(p_items,p_payment_method,p_request_id);
$$;
revoke all on function public.padoka_create_sale_once(jsonb, text, uuid) from public, anon;
grant execute on function public.padoka_create_sale_once(jsonb, text, uuid) to authenticated, service_role;

alter function public.padoka_get_order_payment_state(uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_get_order_payment_state(uuid) from public, anon;
grant execute on function padoka_private.padoka_get_order_payment_state(uuid) to authenticated, service_role;

create function public.padoka_get_order_payment_state(p_order_id uuid)
returns TABLE(order_id uuid, order_code text, payment_status text, total numeric, payment_expires_at timestamp with time zone, paid_at timestamp with time zone, payment_provider text, attempt_id uuid, attempt_status text, pix_copy_paste text, attempt_expires_at timestamp with time zone)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_get_order_payment_state(p_order_id);
$$;
revoke all on function public.padoka_get_order_payment_state(uuid) from public, anon;
grant execute on function public.padoka_get_order_payment_state(uuid) to authenticated, service_role;

alter function public.padoka_get_settings() set schema padoka_private;
revoke all on function padoka_private.padoka_get_settings() from public, anon;
grant execute on function padoka_private.padoka_get_settings() to authenticated, service_role;

create function public.padoka_get_settings()
returns public.padoka_settings
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_get_settings();
$$;
revoke all on function public.padoka_get_settings() from public, anon;
grant execute on function public.padoka_get_settings() to authenticated, service_role;

alter function public.padoka_link_product_barcode(text, text) set schema padoka_private;
revoke all on function padoka_private.padoka_link_product_barcode(text, text) from public, anon;
grant execute on function padoka_private.padoka_link_product_barcode(text, text) to authenticated, service_role;

create function public.padoka_link_product_barcode(p_product_id text, p_barcode text)
returns public.padoka_inventory
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_link_product_barcode(p_product_id,p_barcode);
$$;
revoke all on function public.padoka_link_product_barcode(text, text) from public, anon;
grant execute on function public.padoka_link_product_barcode(text, text) to authenticated, service_role;

alter function public.padoka_list_product_audit(integer) set schema padoka_private;
revoke all on function padoka_private.padoka_list_product_audit(integer) from public, anon;
grant execute on function padoka_private.padoka_list_product_audit(integer) to authenticated, service_role;

create function public.padoka_list_product_audit(p_limit integer DEFAULT 50)
returns TABLE(id uuid, product_id text, product_name text, action text, before_state jsonb, after_state jsonb, actor_user_id uuid, created_at timestamp with time zone)
language sql
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_list_product_audit(p_limit);
$$;
revoke all on function public.padoka_list_product_audit(integer) from public, anon;
grant execute on function public.padoka_list_product_audit(integer) to authenticated, service_role;

alter function public.padoka_list_product_barcodes() set schema padoka_private;
revoke all on function padoka_private.padoka_list_product_barcodes() from public, anon;
grant execute on function padoka_private.padoka_list_product_barcodes() to authenticated, service_role;

create function public.padoka_list_product_barcodes()
returns TABLE(product_id text, barcode text)
language sql
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_list_product_barcodes();
$$;
revoke all on function public.padoka_list_product_barcodes() from public, anon;
grant execute on function public.padoka_list_product_barcodes() to authenticated, service_role;

alter function public.padoka_list_products_admin() set schema padoka_private;
revoke all on function padoka_private.padoka_list_products_admin() from public, anon;
grant execute on function padoka_private.padoka_list_products_admin() to authenticated, service_role;

create function public.padoka_list_products_admin()
returns TABLE(id text, name text, category text, price numeric, active boolean, is_demo boolean, sort_order integer, updated_at timestamp with time zone)
language sql
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_list_products_admin();
$$;
revoke all on function public.padoka_list_products_admin() from public, anon;
grant execute on function public.padoka_list_products_admin() to authenticated, service_role;

alter function public.padoka_list_staff() set schema padoka_private;
revoke all on function padoka_private.padoka_list_staff() from public, anon;
grant execute on function padoka_private.padoka_list_staff() to authenticated, service_role;

create function public.padoka_list_staff()
returns TABLE(user_id uuid, display_name text, email text, role text, active boolean, created_at timestamp with time zone)
language sql
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_list_staff();
$$;
revoke all on function public.padoka_list_staff() from public, anon;
grant execute on function public.padoka_list_staff() to authenticated, service_role;

alter function public.padoka_list_staff_audit(integer) set schema padoka_private;
revoke all on function padoka_private.padoka_list_staff_audit(integer) from public, anon;
grant execute on function padoka_private.padoka_list_staff_audit(integer) to authenticated, service_role;

create function public.padoka_list_staff_audit(p_limit integer DEFAULT 30)
returns TABLE(id bigint, action text, actor_user_id uuid, actor_name text, actor_email text, target_user_id uuid, target_name text, target_email text, old_role text, new_role text, old_active boolean, new_active boolean, created_at timestamp with time zone)
language sql
security invoker
set search_path = ''
as $$
  select * from padoka_private.padoka_list_staff_audit(p_limit);
$$;
revoke all on function public.padoka_list_staff_audit(integer) from public, anon;
grant execute on function public.padoka_list_staff_audit(integer) to authenticated, service_role;

alter function public.padoka_record_production(uuid, numeric, uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_record_production(uuid, numeric, uuid) from public, anon;
grant execute on function padoka_private.padoka_record_production(uuid, numeric, uuid) to authenticated, service_role;

create function public.padoka_record_production(p_plan_id uuid, p_quantity numeric, p_request_id uuid)
returns public.padoka_production_batches
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_record_production(p_plan_id,p_quantity,p_request_id);
$$;
revoke all on function public.padoka_record_production(uuid, numeric, uuid) from public, anon;
grant execute on function public.padoka_record_production(uuid, numeric, uuid) to authenticated, service_role;

alter function public.padoka_register_loss_once(text, numeric, text, text, uuid) set schema padoka_private;
revoke all on function padoka_private.padoka_register_loss_once(text, numeric, text, text, uuid) from public, anon;
grant execute on function padoka_private.padoka_register_loss_once(text, numeric, text, text, uuid) to authenticated, service_role;

create function public.padoka_register_loss_once(p_product_id text, p_quantity numeric, p_reason text, p_note text, p_request_id uuid)
returns public.padoka_losses
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_register_loss_once(p_product_id,p_quantity,p_reason,p_note,p_request_id);
$$;
revoke all on function public.padoka_register_loss_once(text, numeric, text, text, uuid) from public, anon;
grant execute on function public.padoka_register_loss_once(text, numeric, text, text, uuid) to authenticated, service_role;

alter function public.padoka_report_summary(date, date) set schema padoka_private;
revoke all on function padoka_private.padoka_report_summary(date, date) from public, anon;
grant execute on function padoka_private.padoka_report_summary(date, date) to authenticated, service_role;

create function public.padoka_report_summary(p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_report_summary(p_from,p_to);
$$;
revoke all on function public.padoka_report_summary(date, date) from public, anon;
grant execute on function public.padoka_report_summary(date, date) to authenticated, service_role;

alter function public.padoka_save_product(text, text, text, numeric, boolean, boolean, integer) set schema padoka_private;
revoke all on function padoka_private.padoka_save_product(text, text, text, numeric, boolean, boolean, integer) from public, anon;
grant execute on function padoka_private.padoka_save_product(text, text, text, numeric, boolean, boolean, integer) to authenticated, service_role;

create function public.padoka_save_product(p_id text, p_name text, p_category text, p_price numeric, p_active boolean, p_is_demo boolean, p_sort_order integer)
returns public.padoka_products
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_save_product(p_id,p_name,p_category,p_price,p_active,p_is_demo,p_sort_order);
$$;
revoke all on function public.padoka_save_product(text, text, text, numeric, boolean, boolean, integer) from public, anon;
grant execute on function public.padoka_save_product(text, text, text, numeric, boolean, boolean, integer) to authenticated, service_role;

alter function public.padoka_save_profile(text, text, date, boolean, boolean) set schema padoka_private;
revoke all on function padoka_private.padoka_save_profile(text, text, date, boolean, boolean) from public, anon;
grant execute on function padoka_private.padoka_save_profile(text, text, date, boolean, boolean) to authenticated, service_role;

create function public.padoka_save_profile(p_full_name text, p_phone text, p_birthday date DEFAULT NULL::date, p_marketing_opt_in boolean DEFAULT false, p_privacy_accepted boolean DEFAULT false)
returns public.padoka_profiles
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_save_profile(p_full_name,p_phone,p_birthday,p_marketing_opt_in,p_privacy_accepted);
$$;
revoke all on function public.padoka_save_profile(text, text, date, boolean, boolean) from public, anon;
grant execute on function public.padoka_save_profile(text, text, date, boolean, boolean) to authenticated, service_role;

alter function public.padoka_update_inventory_metadata(text, text, numeric) set schema padoka_private;
revoke all on function padoka_private.padoka_update_inventory_metadata(text, text, numeric) from public, anon;
grant execute on function padoka_private.padoka_update_inventory_metadata(text, text, numeric) to authenticated, service_role;

create function public.padoka_update_inventory_metadata(p_product_id text, p_barcode text DEFAULT NULL::text, p_min_quantity numeric DEFAULT 0)
returns public.padoka_inventory
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_update_inventory_metadata(p_product_id,p_barcode,p_min_quantity);
$$;
revoke all on function public.padoka_update_inventory_metadata(text, text, numeric) from public, anon;
grant execute on function public.padoka_update_inventory_metadata(text, text, numeric) to authenticated, service_role;

alter function public.padoka_update_order_status(uuid, text) set schema padoka_private;
revoke all on function padoka_private.padoka_update_order_status(uuid, text) from public, anon;
grant execute on function padoka_private.padoka_update_order_status(uuid, text) to authenticated, service_role;

create function public.padoka_update_order_status(p_order_id uuid, p_status text)
returns public.padoka_orders
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_update_order_status(p_order_id,p_status);
$$;
revoke all on function public.padoka_update_order_status(uuid, text) from public, anon;
grant execute on function public.padoka_update_order_status(uuid, text) to authenticated, service_role;

alter function public.padoka_update_settings(time without time zone, time without time zone, time without time zone, text, text) set schema padoka_private;
revoke all on function padoka_private.padoka_update_settings(time without time zone, time without time zone, time without time zone, text, text) from public, anon;
grant execute on function padoka_private.padoka_update_settings(time without time zone, time without time zone, time without time zone, text, text) to authenticated, service_role;

create function public.padoka_update_settings(p_open_time time without time zone, p_close_time time without time zone, p_night_time time without time zone DEFAULT NULL::time without time zone, p_payment_method text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
returns public.padoka_settings
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_update_settings(p_open_time,p_close_time,p_night_time,p_payment_method,p_note);
$$;
revoke all on function public.padoka_update_settings(time without time zone, time without time zone, time without time zone, text, text) from public, anon;
grant execute on function public.padoka_update_settings(time without time zone, time without time zone, time without time zone, text, text) to authenticated, service_role;

alter function public.padoka_update_staff(uuid, text, boolean) set schema padoka_private;
revoke all on function padoka_private.padoka_update_staff(uuid, text, boolean) from public, anon;
grant execute on function padoka_private.padoka_update_staff(uuid, text, boolean) to authenticated, service_role;

create function public.padoka_update_staff(p_user_id uuid, p_role text, p_active boolean)
returns public.padoka_staff_users
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_update_staff(p_user_id,p_role,p_active);
$$;
revoke all on function public.padoka_update_staff(uuid, text, boolean) from public, anon;
grant execute on function public.padoka_update_staff(uuid, text, boolean) to authenticated, service_role;

alter function public.padoka_upsert_production_plan(date, text, numeric, text) set schema padoka_private;
revoke all on function padoka_private.padoka_upsert_production_plan(date, text, numeric, text) from public, anon;
grant execute on function padoka_private.padoka_upsert_production_plan(date, text, numeric, text) to authenticated, service_role;

create function public.padoka_upsert_production_plan(p_plan_date date, p_product_id text, p_planned_quantity numeric, p_note text DEFAULT NULL::text)
returns public.padoka_production_plans
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_upsert_production_plan(p_plan_date,p_product_id,p_planned_quantity,p_note);
$$;
revoke all on function public.padoka_upsert_production_plan(date, text, numeric, text) from public, anon;
grant execute on function public.padoka_upsert_production_plan(date, text, numeric, text) to authenticated, service_role;

alter function public.padoka_void_sale(uuid, text) set schema padoka_private;
revoke all on function padoka_private.padoka_void_sale(uuid, text) from public, anon;
grant execute on function padoka_private.padoka_void_sale(uuid, text) to authenticated, service_role;

create function public.padoka_void_sale(p_sale_id uuid, p_reason text)
returns public.padoka_sales
language sql
security invoker
set search_path = ''
as $$
  select padoka_private.padoka_void_sale(p_sale_id,p_reason);
$$;
revoke all on function public.padoka_void_sale(uuid, text) from public, anon;
grant execute on function public.padoka_void_sale(uuid, text) to authenticated, service_role;

