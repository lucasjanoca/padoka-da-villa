-- PADOKA DA VILLA — índices de suporte às FKs do PADOKA Club
create index if not exists padoka_loyalty_admin_audit_actor_idx
  on public.padoka_loyalty_admin_audit(actor_user_id);
create index if not exists padoka_loyalty_admin_audit_target_idx
  on public.padoka_loyalty_admin_audit(target_user_id);
create index if not exists padoka_loyalty_admin_audit_reward_idx
  on public.padoka_loyalty_admin_audit(reward_id);
create index if not exists padoka_loyalty_admin_audit_redemption_idx
  on public.padoka_loyalty_admin_audit(redemption_id);

create index if not exists padoka_loyalty_campaigns_created_by_idx
  on public.padoka_loyalty_campaigns(created_by);
create index if not exists padoka_loyalty_campaigns_updated_by_idx
  on public.padoka_loyalty_campaigns(updated_by);

create index if not exists padoka_loyalty_ledger_actor_idx
  on public.padoka_loyalty_ledger(actor_user_id);
create index if not exists padoka_loyalty_ledger_campaign_idx
  on public.padoka_loyalty_ledger(campaign_id);

create index if not exists padoka_loyalty_redemptions_used_by_idx
  on public.padoka_loyalty_redemptions(used_by);

create index if not exists padoka_loyalty_rewards_created_by_idx
  on public.padoka_loyalty_rewards(created_by);
create index if not exists padoka_loyalty_rewards_updated_by_idx
  on public.padoka_loyalty_rewards(updated_by);

create index if not exists padoka_loyalty_settings_updated_by_idx
  on public.padoka_loyalty_settings(updated_by);
