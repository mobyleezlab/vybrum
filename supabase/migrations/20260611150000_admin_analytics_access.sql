-- Allow admins to read kits, user_shields and unlocked_templates for the analytics dashboard.

drop policy if exists "Admins can read all kits" on public.kits;
create policy "Admins can read all kits"
  on public.kits
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read all user_shields" on public.user_shields;
create policy "Admins can read all user_shields"
  on public.user_shields
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read all unlocked_templates" on public.unlocked_templates;
create policy "Admins can read all unlocked_templates"
  on public.unlocked_templates
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create index if not exists kits_created_at_idx on public.kits (created_at desc);
create index if not exists kits_model_code_idx on public.kits (model_code);
create index if not exists user_shields_created_at_idx on public.user_shields (created_at desc);
create index if not exists unlocked_templates_created_at_idx on public.unlocked_templates (created_at desc);
create index if not exists unlocked_templates_model_code_idx on public.unlocked_templates (model_code);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_last_seen_at_idx on public.profiles (last_seen_at desc);
create index if not exists credit_ledger_created_at_idx on public.credit_ledger (created_at desc);
