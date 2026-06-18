-- Grant Data API privileges for tables used by authenticated users
GRANT SELECT, INSERT ON public.unlocked_templates TO authenticated;
GRANT ALL ON public.unlocked_templates TO service_role;

GRANT SELECT, INSERT ON public.unlocked_packs TO authenticated;
GRANT ALL ON public.unlocked_packs TO service_role;

GRANT SELECT ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;

GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
