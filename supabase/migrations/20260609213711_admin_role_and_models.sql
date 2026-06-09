-- Permite plan = 'admin' e cria helper is_admin().
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('guest','free','pro','premium','elite','admin'));

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = _user_id and plan = 'admin')
$$;
grant execute on function public.is_admin(uuid) to authenticated, anon;

drop policy if exists "models admin insert" on public.models;
create policy "models admin insert" on public.models for insert to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "models admin update" on public.models;
create policy "models admin update" on public.models for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "models admin delete" on public.models;
create policy "models admin delete" on public.models for delete to authenticated
  using (public.is_admin(auth.uid()));
