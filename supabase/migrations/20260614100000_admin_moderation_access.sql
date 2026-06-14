-- Admin moderation access: user_shields (read+delete) and security_logs (read)

drop policy if exists "Admins can view all shields" on public.user_shields;
create policy "Admins can view all shields"
  on public.user_shields
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete any shield" on public.user_shields;
create policy "Admins can delete any shield"
  on public.user_shields
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can view security logs" on public.security_logs;
create policy "Admins can view security logs"
  on public.security_logs
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create index if not exists idx_user_shields_created_at on public.user_shields(created_at desc);
create index if not exists idx_user_shields_user_id on public.user_shields(user_id);
create index if not exists idx_security_logs_created_at on public.security_logs(created_at desc);
create index if not exists idx_security_logs_event_type on public.security_logs(event_type);
