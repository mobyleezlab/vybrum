-- The public storefront view models_with_status joins unlocked_templates.
-- Anon needs table-level SELECT (GRANT) so the view query doesn't 403,
-- but RLS still hides all rows (no anon policy exists), so anon sees is_unlocked=false.
GRANT SELECT ON public.unlocked_templates TO anon;
