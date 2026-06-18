-- Fix is_admin(uid) overload to use the passed uid parameter
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND plan = 'admin'
  );
$$;

-- Allow anonymous visitors to see active credit packages (public storefront)
DROP POLICY IF EXISTS "credit_packages: anon read active" ON public.credit_packages;
CREATE POLICY "credit_packages: anon read active"
  ON public.credit_packages
  FOR SELECT
  TO anon
  USING (is_active = true);

GRANT SELECT ON public.credit_packages TO anon;
