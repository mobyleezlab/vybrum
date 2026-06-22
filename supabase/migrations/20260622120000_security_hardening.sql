-- Security hardening migration
-- Fixes:
--  1) is_admin(uid) ignoring its parameter
--  2) profiles privilege escalation via UPDATE
--  3) avatars storage bucket allowing object listing
--  4) realtime.messages unrestricted channel access

-- 1) Fix is_admin(uid uuid) to actually use the uid parameter
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND plan = 'admin'
  );
$fn$;

-- 2) Profiles: block privilege escalation on sensitive columns.
--    Attach the existing profiles_block_privilege_escalation function as a BEFORE UPDATE trigger
--    (it exists in the db but no trigger was attached), AND tighten RLS WITH CHECK
--    so non-admins can never persist sensitive changes through PostgREST.
DROP TRIGGER IF EXISTS profiles_block_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER profiles_block_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_block_privilege_escalation();

DROP POLICY IF EXISTS "profiles: update" ON public.profiles;

CREATE POLICY "profiles: update self non-sensitive"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = profiles.id)
  AND is_disabled = (SELECT p.is_disabled FROM public.profiles p WHERE p.id = profiles.id)
  AND plan_expires_at IS NOT DISTINCT FROM
      (SELECT p.plan_expires_at FROM public.profiles p WHERE p.id = profiles.id)
);

CREATE POLICY "profiles: update admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3) Avatars bucket: drop the broad SELECT policy that lets clients LIST all objects.
--    Public buckets serve direct URLs without any storage.objects RLS — listing is what
--    the policy enabled, and the app does not need it (avatar URLs are stored in the
--    `avatars` table row and referenced directly).
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;

-- 4) Realtime: restrict channel topic subscriptions to the owning user.
--    Topic naming convention used by the app: `credits-<user_id>` (see src/lib/credits.ts).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime: deny anon" ON realtime.messages;
CREATE POLICY "realtime: deny anon"
ON realtime.messages
FOR SELECT
TO anon
USING (false);

DROP POLICY IF EXISTS "realtime: own user topics" ON realtime.messages;
CREATE POLICY "realtime: own user topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only topics that end with the caller's uid (e.g. "credits-<uid>")
  realtime.topic() LIKE ('%' || auth.uid()::text)
);
