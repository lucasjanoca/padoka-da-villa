-- PADOKA DA VILLA — idempotência no registro de perdas
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende da migration 003. Não cria trigger em auth.users.

alter table public.padoka_losses
  add column if not exists request_id uuid;

create unique index if not exists padoka_losses_request_id_uidx
  on public.padoka_losses(request_id)
  where request_id is not null;

create or replace function public.padoka_register_loss_once(
  p_product_id text,
  p_quantity numeric,
  p_reason text,
  p_note text,
  p_request_id uuid
) returns public.padoka_losses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loss public.padoka_losses;
  v_inventory public.padoka_inventory;
  v_note text;
begin
  if not public.padoka_staff_has_role(array['owner','manager','stock','production']) then
    raise exception 'padoka loss permission required';
  end if;
  if p_product_id is null or nullif(trim(p_product_id),'') is null then raise exception 'loss product required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'loss quantity must be positive'; end if;
  if p_reason not in ('Vencimento','Quebra / avaria','Sobra de produção','Erro de preparo','Outro') then raise exception 'invalid loss reason'; end if;
  if p_request_id is null then raise exception 'loss request id required'; end if;

  v_note := nullif(trim(coalesce(p_note,'')),'');
  if char_length(coalesce(v_note,'')) > 500 then raise exception 'loss note too long'; end if;

  -- Retry idempotente: a mesma operação devolve a perda já criada.
  select * into v_loss
  from public.padoka_losses
  where request_id = p_request_id;

  if v_loss.id is not null then
    if v_loss.product_id is distinct from p_product_id
       or v_loss.quantity is distinct from p_quantity
       or v_loss.reason is distinct from p_reason
       or coalesce(v_loss.note,'') is distinct from coalesce(v_note,'') then
      raise exception 'loss request id conflict';
    end if;
    return v_loss;
  end if;

  if not exists(
    select 1 from public.padoka_products p
    where p.id = p_product_id and p.active = true
  ) then
    raise exception 'unknown or inactive product';
  end if;

  -- Lock do estoque serializa perdas/ajustes concorrentes do mesmo produto.
  select * into v_inventory
  from public.padoka_inventory
  where product_id = p_product_id
  for update;

  if v_inventory.product_id is null then raise exception 'inventory not initialized'; end if;

  -- Revalida depois do lock para retries simultâneos do mesmo produto.
  select * into v_loss
  from public.padoka_losses
  where request_id = p_request_id;

  if v_loss.id is not null then
    if v_loss.product_id is distinct from p_product_id
       or v_loss.quantity is distinct from p_quantity
       or v_loss.reason is distinct from p_reason
       or coalesce(v_loss.note,'') is distinct from coalesce(v_note,'') then
      raise exception 'loss request id conflict';
    end if;
    return v_loss;
  end if;

  if v_inventory.quantity < p_quantity then raise exception 'insufficient inventory'; end if;

  update public.padoka_inventory
  set quantity = quantity - p_quantity,
      updated_by = auth.uid(),
      updated_at = now()
  where product_id = p_product_id;

  insert into public.padoka_losses(request_id,product_id,quantity,reason,note,created_by)
  values(p_request_id,p_product_id,p_quantity,p_reason,v_note,auth.uid())
  returning * into v_loss;

  insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
  values(p_product_id,-p_quantity,'Perda: ' || p_reason,'loss',v_loss.id,auth.uid());

  return v_loss;
end;
$$;

revoke all on function public.padoka_register_loss_once(text,numeric,text,text,uuid) from public, anon;
grant execute on function public.padoka_register_loss_once(text,numeric,text,text,uuid) to authenticated;
