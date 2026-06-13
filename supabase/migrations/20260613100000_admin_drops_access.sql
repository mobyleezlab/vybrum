-- Admin access to unlocked_packs for the Drops/Campanhas dashboard

DROP POLICY IF EXISTS "Admin can read unlocked_packs" ON public.unlocked_packs;
CREATE POLICY "Admin can read unlocked_packs"
  ON public.unlocked_packs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

GRANT SELECT ON public.unlocked_packs TO authenticated;
GRANT ALL ON public.unlocked_packs TO service_role;

-- Performance indexes for campaign aggregation
CREATE INDEX IF NOT EXISTS unlocked_packs_pack_id_idx ON public.unlocked_packs (pack_id);
CREATE INDEX IF NOT EXISTS unlocked_packs_created_at_idx ON public.unlocked_packs (created_at DESC);
CREATE INDEX IF NOT EXISTS packs_available_until_idx ON public.packs (available_until);
CREATE INDEX IF NOT EXISTS packs_is_active_idx ON public.packs (is_active);
