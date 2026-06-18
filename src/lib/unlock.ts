import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type UnlockResult =
  | { success: true; credits_spent: number; balance_after: number }
  | { error: string; balance?: number; cost?: number };

function messageFor(res: { error: string; balance?: number; cost?: number }): string {
  switch (res.error) {
    case "insufficient_credits":
      return `Créditos insuficientes. Você tem ${res.balance ?? 0} créditos e precisa de ${res.cost ?? 0}.`;
    case "already_unlocked":
      return "Este item já está desbloqueado.";
    case "account_disabled":
      return "Sua conta está desativada. Entre em contato com o suporte.";
    case "pack_expired":
      return "Este pack não está mais disponível.";
    case "pack_not_found_or_inactive":
      return "Este pack não está mais disponível.";
    case "model_not_found":
      return "Modelo não encontrado.";
    case "model_is_free":
      return "Este modelo é gratuito.";
    case "not_authenticated":
      return "Entre na sua conta para desbloquear.";
    default:
      return "Não foi possível completar a operação. Tente novamente.";
  }
}

function invalidateAfterUnlock(qc: ReturnType<typeof useQueryClient>, userId: string | undefined) {
  qc.invalidateQueries({ queryKey: ["credit-balance", userId ?? "anon"] });
  qc.invalidateQueries({ queryKey: ["entitlements", userId ?? "anon"] });
  qc.invalidateQueries({ queryKey: ["unlocked-packs"] });
}

export function useUnlockModel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (modelCode: string): Promise<UnlockResult> => {
      const { data, error } = await (supabase as any).rpc("unlock_template", {
        p_model_code: modelCode,
      });
      if (error) throw new Error(error.message);
      return data as UnlockResult;
    },
    onSuccess: (res) => {
      if ("success" in res && res.success) {
        invalidateAfterUnlock(qc, user?.id);
        toast.success(`Modelo desbloqueado! Saldo: ${res.balance_after} créditos`);
      } else if ("error" in res) {
        toast.error(messageFor(res));
      }
    },
    onError: () => {
      toast.error("Não foi possível completar a operação. Tente novamente.");
    },
  });
}

export function useUnlockPack() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (packId: string): Promise<UnlockResult> => {
      const { data, error } = await (supabase as any).rpc("unlock_pack", {
        p_pack_id: packId,
      });
      if (error) throw new Error(error.message);
      return data as UnlockResult;
    },
    onSuccess: (res) => {
      if ("success" in res && res.success) {
        invalidateAfterUnlock(qc, user?.id);
        toast.success(`Pack desbloqueado! Saldo: ${res.balance_after} créditos`);
      } else if ("error" in res) {
        toast.error(messageFor(res));
      }
    },
    onError: () => {
      toast.error("Não foi possível completar a operação. Tente novamente.");
    },
  });
}