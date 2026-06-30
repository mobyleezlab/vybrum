-- Execute no SQL Editor do Supabase
-- Máquina de estados para compras Google Play

ALTER TABLE public.credit_purchases
  ADD COLUMN IF NOT EXISTS base_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_purchases_status_check'
  ) THEN
    ALTER TABLE public.credit_purchases
      ADD CONSTRAINT credit_purchases_status_check
      CHECK (status IN ('pending','completed','failed','refunded'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS credit_purchases_user_status_idx
  ON public.credit_purchases (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_purchases_token_idx
  ON public.credit_purchases (google_purchase_token)
  WHERE google_purchase_token IS NOT NULL;

DROP TRIGGER IF EXISTS trg_credit_purchases_updated_at ON public.credit_purchases;
CREATE TRIGGER trg_credit_purchases_updated_at
  BEFORE UPDATE ON public.credit_purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- start_purchase: usuário autenticado cria compra "pending"
CREATE OR REPLACE FUNCTION public.start_purchase(
  p_package_id uuid,
  p_google_purchase_token text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_pkg credit_packages%ROWTYPE;
  v_purchase_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF NOT public.is_active_user() THEN
    RETURN jsonb_build_object('error', 'account_disabled');
  END IF;

  SELECT * INTO v_pkg FROM public.credit_packages
  WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'package_not_found_or_inactive');
  END IF;

  INSERT INTO public.credit_purchases (
    user_id, package_id, base_credits, bonus_credits, credits_granted,
    price_brl, google_purchase_token, status
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.credits, COALESCE(v_pkg.bonus_credits, 0),
    v_pkg.credits + COALESCE(v_pkg.bonus_credits, 0),
    v_pkg.price_brl, p_google_purchase_token, 'pending'
  )
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object('success', true, 'purchase_id', v_purchase_id, 'status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.start_purchase(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.start_purchase(uuid, text) TO authenticated;

-- complete_purchase: service_role conclui e credita saldo
CREATE OR REPLACE FUNCTION public.complete_purchase(
  p_purchase_id uuid,
  p_google_order_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p credit_purchases%ROWTYPE;
  v_total integer;
  v_new_balance integer;
BEGIN
  SELECT * INTO v_p FROM public.credit_purchases
  WHERE id = p_purchase_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'purchase_not_found');
  END IF;

  IF v_p.status = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true);
  END IF;

  IF v_p.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'invalid_state', 'status', v_p.status);
  END IF;

  v_total := COALESCE(v_p.base_credits, 0) + COALESCE(v_p.bonus_credits, 0);

  INSERT INTO public.credit_balances (user_id, balance, total_earned, total_spent)
  VALUES (v_p.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_balances
  SET balance = balance + v_total,
      total_earned = total_earned + v_total,
      updated_at = now()
  WHERE user_id = v_p.user_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_ledger (user_id, amount, balance_after, type, ref_id)
  VALUES (v_p.user_id, v_total, v_new_balance, 'purchase', p_purchase_id::text);

  UPDATE public.credit_purchases
  SET status = 'completed',
      completed_at = now(),
      google_order_id = COALESCE(p_google_order_id, google_order_id),
      credits_granted = v_total,
      updated_at = now()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object('success', true, 'credits_granted', v_total, 'balance_after', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_purchase(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_purchase(uuid, text) TO service_role;

-- fail_purchase: service_role marca como falha sem creditar
CREATE OR REPLACE FUNCTION public.fail_purchase(
  p_purchase_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p credit_purchases%ROWTYPE;
BEGIN
  SELECT * INTO v_p FROM public.credit_purchases
  WHERE id = p_purchase_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'purchase_not_found');
  END IF;

  IF v_p.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'already_completed');
  END IF;

  UPDATE public.credit_purchases
  SET status = 'failed',
      failure_reason = p_reason,
      updated_at = now()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.fail_purchase(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.fail_purchase(uuid, text) TO service_role;