import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface LedgerEntry {
  id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface UnlockedTemplate {
  id: string;
  model_code: string;
  unlock_type: string;
  credits_spent: number;
  created_at: string;
}

export function useCreditLedger(limit = 50) {
  const { user, loading } = useAuth();
  return useQuery<LedgerEntry[]>({
    queryKey: ["credit-ledger", user?.id ?? "anon", limit],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credit_ledger")
        .select("id, amount, balance_after, type, description, reference_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as LedgerEntry[];
    },
  });
}

export function useUnlockedTemplates() {
  const { user, loading } = useAuth();
  return useQuery<UnlockedTemplate[]>({
    queryKey: ["unlocked-templates", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("unlocked_templates")
        .select("id, model_code, unlock_type, credits_spent, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as UnlockedTemplate[];
    },
  });
}

export function ledgerLabel(type: string): string {
  switch (type) {
    case "purchase": return "Compra de créditos";
    case "bonus": return "Bônus";
    case "unlock_template": return "Desbloqueio de template";
    case "buy_marketplace": return "Compra no marketplace";
    case "refund": return "Estorno";
    case "admin_grant": return "Crédito do admin";
    default: return type;
  }
}