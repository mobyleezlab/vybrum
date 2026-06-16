-- Avatars catalog (admin-managed, public read of active ones)
CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.avatars TO anon, authenticated;
GRANT ALL    ON public.avatars TO service_role;

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avatars read active" ON public.avatars;
CREATE POLICY "avatars read active"
  ON public.avatars FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "avatars admin manage" ON public.avatars;
CREATE POLICY "avatars admin manage"
  ON public.avatars FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reference avatar from profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_id uuid REFERENCES public.avatars(id) ON DELETE SET NULL;

-- Seed 10 default avatars (idempotent on name)
INSERT INTO public.avatars (name, image_url, sort_order)
SELECT v.name, v.image_url, v.sort_order FROM (VALUES
  ('Neon',     'https://api.dicebear.com/9.x/adventurer/svg?seed=Neon&backgroundColor=68ed00',     1),
  ('Pulse',    'https://api.dicebear.com/9.x/adventurer/svg?seed=Pulse&backgroundColor=00d1ff',    2),
  ('Aurora',   'https://api.dicebear.com/9.x/adventurer/svg?seed=Aurora&backgroundColor=ff4d8d',   3),
  ('Solar',    'https://api.dicebear.com/9.x/adventurer/svg?seed=Solar&backgroundColor=ffb800',    4),
  ('Onyx',     'https://api.dicebear.com/9.x/adventurer/svg?seed=Onyx&backgroundColor=1a1a1a',     5),
  ('Mint',     'https://api.dicebear.com/9.x/adventurer/svg?seed=Mint&backgroundColor=2dd4bf',     6),
  ('Violet',   'https://api.dicebear.com/9.x/adventurer/svg?seed=Violet&backgroundColor=8b5cf6',   7),
  ('Crimson',  'https://api.dicebear.com/9.x/adventurer/svg?seed=Crimson&backgroundColor=ef4444',  8),
  ('Storm',    'https://api.dicebear.com/9.x/adventurer/svg?seed=Storm&backgroundColor=64748b',    9),
  ('Ivory',    'https://api.dicebear.com/9.x/adventurer/svg?seed=Ivory&backgroundColor=f1f5f9',   10)
) AS v(name, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.avatars WHERE avatars.name = v.name);
