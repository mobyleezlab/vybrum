-- Global key/value app settings managed by admins.
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings admin read" ON public.app_settings;
CREATE POLICY "app_settings admin read"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "app_settings admin write" ON public.app_settings;
CREATE POLICY "app_settings admin write"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin audit log: ensure admin SELECT access for the Configurações panel.
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

DROP POLICY IF EXISTS "admin_audit_log admin read" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log admin read"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);

-- Seed default settings keys (idempotent).
INSERT INTO public.app_settings (key, value, description) VALUES
  ('maintenance_mode', 'false'::jsonb, 'Quando true, o app exibe modo manutenção.'),
  ('signups_enabled', 'true'::jsonb, 'Permite novos cadastros quando true.'),
  ('new_user_initial_credits', '0'::jsonb, 'Créditos concedidos automaticamente a novos usuários.'),
  ('support_email', '"suporte@vybrum.com"'::jsonb, 'E-mail de contato exibido no app.'),
  ('announcement_banner', '""'::jsonb, 'Texto opcional exibido no topo do app. Vazio para ocultar.')
ON CONFLICT (key) DO NOTHING;
