-- Leitura pública (anon) de packs ativos + itens, para listPacksPublic.
GRANT SELECT ON public.packs TO anon;
GRANT SELECT ON public.pack_items TO anon;

DROP POLICY IF EXISTS "Public can read active packs" ON public.packs;
CREATE POLICY "Public can read active packs"
  ON public.packs FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read items of active packs" ON public.pack_items;
CREATE POLICY "Public can read items of active packs"
  ON public.pack_items FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.packs p WHERE p.id = pack_items.pack_id AND p.is_active = true));
