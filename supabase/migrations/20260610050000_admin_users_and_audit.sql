ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read audit" ON public.admin_audit_log;
CREATE POLICY "admin read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin insert audit" ON public.admin_audit_log;
CREATE POLICY "admin insert audit" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

DROP POLICY IF EXISTS "admin update profiles" ON public.profiles;
CREATE POLICY "admin update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin read profiles" ON public.profiles;
CREATE POLICY "admin read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR id = auth.uid());

DROP POLICY IF EXISTS "admin read balances" ON public.credit_balances;
CREATE POLICY "admin read balances" ON public.credit_balances
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "admin update balances" ON public.credit_balances;
CREATE POLICY "admin update balances" ON public.credit_balances
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin insert balances" ON public.credit_balances;
CREATE POLICY "admin insert balances" ON public.credit_balances
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin insert ledger" ON public.credit_ledger;
CREATE POLICY "admin insert ledger" ON public.credit_ledger
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "admin read ledger" ON public.credit_ledger;
CREATE POLICY "admin read ledger" ON public.credit_ledger
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR user_id = auth.uid());
