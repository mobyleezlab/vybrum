-- Allow admins to manage packs and pack_items used by /admin/creditos

DROP POLICY IF EXISTS "Admin can manage packs" ON public.packs;
CREATE POLICY "Admin can manage packs"
  ON public.packs
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage pack_items" ON public.pack_items;
CREATE POLICY "Admin can manage pack_items"
  ON public.pack_items
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.packs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pack_items TO authenticated;
GRANT ALL ON public.packs TO service_role;
GRANT ALL ON public.pack_items TO service_role;
