-- Mantém a validade do Pix em 5 minutos como regra única.
update public.padoka_payment_settings
set expiration_seconds = 300,
    updated_at = now()
where id = true;
