-- Garante permissões básicas da Data API na tabela profiles.
-- RLS continua restringindo o acesso por linha.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
