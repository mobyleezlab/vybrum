-- Run in the Supabase SQL Editor.
-- Hardens profiles RLS to fix:
--   * profiles_select_policy_anon_bypass  (convert anon-deny to RESTRICTIVE)
--   * profiles_update_policy_no_field_restriction  (add column WITH CHECK)

-- 1) SELECT: RESTRICTIVE anon-deny + PERMISSIVE self/admin read.
DROP POLICY IF EXISTS "profiles: deny anon select" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select self or admin" ON public.profiles;

CREATE POLICY "profiles: deny anon select"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING (auth.role() <> 'anon');

CREATE POLICY "profiles: select self or admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 2) UPDATE: block plan/is_disabled/plan_expires_at escalation via WITH CHECK,
--    so RLS enforces the restriction even if the trigger is ever dropped.
DROP POLICY IF EXISTS "profiles: update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update self" ON public.profiles;

CREATE POLICY "profiles: update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (
    (auth.uid() = id OR public.is_admin(auth.uid()))
    AND (
      public.is_admin(auth.uid())
      OR (
        plan IS NOT DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
        AND is_disabled IS NOT DISTINCT FROM (SELECT p.is_disabled FROM public.profiles p WHERE p.id = auth.uid())
        AND plan_expires_at IS NOT DISTINCT FROM (SELECT p.plan_expires_at FROM public.profiles p WHERE p.id = auth.uid())
      )
    )
  );