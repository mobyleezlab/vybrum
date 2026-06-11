-- Allow admins to read credit purchases and packages for the billing dashboard

drop policy if exists "Admins can read all purchases" on public.credit_purchases;
create policy "Admins can read all purchases"
  on public.credit_purchases
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read all packages" on public.credit_packages;
create policy "Admins can read all packages"
  on public.credit_packages
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create index if not exists credit_purchases_status_completed_at_idx
  on public.credit_purchases (status, completed_at desc);

create index if not exists credit_purchases_status_created_at_idx
  on public.credit_purchases (status, created_at desc);
