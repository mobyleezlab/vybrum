import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ExportUnlockResult =
  | { success: true; credits_spent: number; balance_after: number }
  | { error: string; balance?: number; cost?: number };

/**
 * Returns whether the current user can export HD/SVG/PDF for a given model.
 * - Free models: requires a row in unlocked_templates with export_unlocked=true.
 * - Paid models (pro/premium/elite/rare): export is included once the model is unlocked.
 */
export function useExportUnlocked(modelCode: string | undefined, category: string | null | undefined) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const isFree = (category ?? "free").toLowerCase() === "free";

  useEffect(() => {
    if (!user || !modelCode) return;
    const ch = supabase
      .channel(`export-unlock-${user.id}-${modelCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "unlocked_templates",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["export-unlocked", user.id, modelCode] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, modelCode, qc]);

  return useQuery({
    queryKey: ["export-unlocked", user?.id ?? "anon", modelCode ?? ""],
    enabled: !loading && !!user && !!modelCode,
    staleTime: 30_000,
    queryFn: async (): Promise<{ exportUnlocked: boolean; isFree: boolean }> => {
      if (!isFree) return { exportUnlocked: true, isFree: false };
      const { data, error } = await (supabase as any)
        .from("unlocked_templates")
        .select("export_unlocked")
        .eq("model_code", modelCode!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { exportUnlocked: !!data?.export_unlocked, isFree: true };
    },
    placeholderData: { exportUnlocked: !isFree, isFree },
  });
}

function messageFor(res: { error: string; balance?: number; cost?: number }): string {
  switch (res.error) {
    case "insufficient_credits":
      return `Créditos insuficientes. Você tem ${res.balance ?? 0} créditos e precisa de ${res.cost ?? 0}.`;
    case "export_already_unlocked":
    case "export_already_included":
      return "Exportação já liberada neste modelo.";
    case "model_not_found":
      return "Modelo não encontrado.";
    case "account_disabled":
      return "Sua conta está desativada.";
    case "not_authenticated":
      return "Entre na sua conta para desbloquear.";
    default:
      return "Não foi possível desbloquear a exportação. Tente novamente.";
  }
}

export function useUnlockExport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (modelCode: string): Promise<ExportUnlockResult> => {
      const { data, error } = await (supabase as any).rpc("unlock_export", {
        p_model_code: modelCode,
      });
      if (error) throw new Error(error.message);
      return data as ExportUnlockResult;
    },
    onSuccess: (res, modelCode) => {
      if ("success" in res && res.success) {
        qc.invalidateQueries({ queryKey: ["credit-balance", user?.id ?? "anon"] });
        qc.invalidateQueries({ queryKey: ["export-unlocked", user?.id ?? "anon", modelCode] });
        toast.success(`Exportação liberada! Saldo: ${res.balance_after} créditos`);
      } else if ("error" in res) {
        if (res.error === "export_already_unlocked" || res.error === "export_already_included") {
          qc.invalidateQueries({ queryKey: ["export-unlocked", user?.id ?? "anon", modelCode] });
        }
        toast.error(messageFor(res));
      }
    },
    onError: () => {
      toast.error("Não foi possível desbloquear a exportação. Tente novamente.");
    },
  });
}