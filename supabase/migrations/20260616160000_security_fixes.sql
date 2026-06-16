-- Security fixes:
--  1) Block self privilege escalation via profiles.plan / is_disabled
--  2) Add explicit UPDATE policy for the 'user-shields' storage bucket

-- =========================================================================
-- 1) profiles: prevent non-admins from changing privileged columns
-- =========================================================================

DROP POLICY IF EXISTS "Users can update own profile"          ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile"              ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "profiles: update"                      ON public.profiles;
DROP POLICY IF EXISTS "update own profile"                    ON public.profiles;
DROP POLICY IF EXISTS "self update profiles"                  ON public.profiles;

CREATE POLICY "self update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Defense-in-depth: even if a future policy is overly permissive, this
-- trigger forces privileged columns to remain unchanged unless caller is admin.
CREATE OR REPLACE FUNCTION public.profiles_block_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      NEW.plan := OLD.plan;
    END IF;
    IF NEW.is_disabled IS DISTINCT FROM OLD.is_disabled THEN
      NEW.is_disabled := OLD.is_disabled;
    END IF;
    IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      NEW.plan_expires_at := OLD.plan_expires_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_block_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_privilege_escalation();

-- =========================================================================
-- 2) storage: explicit UPDATE policy for user-shields bucket
-- =========================================================================

DROP POLICY IF EXISTS "Users can update their own shields" ON storage.objects;
CREATE POLICY "Users can update their own shields"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-shields'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-shields'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
