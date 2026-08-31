-- Harden selected PADOKA SECURITY DEFINER implementations against search_path hijacking.
-- Their relation/helper references are already schema-qualified, so an empty
-- search_path does not change authorization or business behavior.

alter function padoka_private.padoka_list_product_barcodes()
  set search_path = '';

alter function padoka_private.padoka_save_profile(text, text, date, boolean, boolean)
  set search_path = '';

alter function padoka_private.padoka_update_order_status(uuid, text)
  set search_path = '';
