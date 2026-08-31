import fs from 'node:fs';

const migration=fs.readFileSync('supabase/070_profile_staff_read_scope.sql','utf8');
const orders=fs.readFileSync('pedidos.html','utf8');

const checks=[
  [migration.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'), 'migration must target the PADOKA backend explicitly'],
  [migration.includes('alter table public.padoka_profiles enable row level security'), 'customer profiles must keep RLS enabled'],
  [migration.includes('drop policy if exists "padoka_profiles_read_authorized"'), 'previous profile read policy must be replaced'],
  [migration.includes('id = (select auth.uid())'), 'customers must retain access to their own PADOKA profile'],
  [migration.includes("app_scope = 'padoka'"), 'customer self-read must stay scoped to PADOKA'],
  [migration.includes("public.padoka_staff_has_role(array['owner','manager'])"), 'management must retain the explicit customer-service read path'],
  [migration.includes('public.padoka_is_staff()'), 'non-management profile access must still require active PADOKA staff'],
  [migration.includes('exists (')&&migration.includes('from public.padoka_orders o')&&migration.includes('o.customer_id = padoka_profiles.id'), 'non-management staff must only see profiles tied to an order'],
  [migration.includes("o.payment_status = 'paid'"), 'staff profile visibility must respect the paid-order gate'],
  [migration.includes('public.padoka_pix_gate_enabled()'), 'profile policy must stay aligned with the order Pix gate'],
  [!/^\s*grant\s+/im.test(migration), 'profile read hardening must not widen grants'],
  [!/(create|drop)\s+trigger[\s\S]{0,300}auth\.users/i.test(migration), 'migration must never touch a global auth.users trigger'],
  [orders.includes("sb.from('padoka_profiles').select('id,full_name,phone').in('id',ids)"), 'orders UI must request only profiles for customers in the visible order list']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA profile staff read scope audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA profile staff read scope audit passed');
