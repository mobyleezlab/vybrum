-- The public models_with_status view is queried unauthenticated (anon) from the storefront.
-- Run it with the view owner's privileges so it can read unlocked_templates/credit_balances
-- internally without exposing those tables to anon directly.
ALTER VIEW public.models_with_status SET (security_invoker = false);
GRANT SELECT ON public.models_with_status TO anon, authenticated;
