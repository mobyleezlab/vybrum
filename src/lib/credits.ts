import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { listPacksPublic } from "@/lib/catalog.functions";

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  total_credits: number | null;
  price_brl: number;
  sort_order: number;
  is_active: boolean;
}

export interface PackItem {
  id: string;
  model_code: string;
  sort_order: number | null;
}

export interface Pack {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cost_credits: number;
  original_value: number;
  discount_pct: number | null;
  is_limited: boolean;
  is_active: boolean;
  available_until: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  pack_items: PackItem[];
}

export function useCreditBalance() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`credits-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_balances", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["credit-balance", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["credit-balance", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credit_balances")
        .select("balance,total_earned,total_spent")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? { balance: 0, total_earned: 0, total_spent: 0 };
    },
  });
}

export function useCreditPackages() {
  const { user, loading } = useAuth();
  return useQuery<CreditPackage[]>({
    queryKey: ["credit-packages", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credit_packages")
        .select("id,name,credits,bonus_credits,total_credits,price_brl,sort_order,is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CreditPackage[];
    },
  });
}

export function usePacks() {
  const fetchPacks = useServerFn(listPacksPublic);
  return useQuery<Pack[]>({
    queryKey: ["packs", "public"],
    staleTime: 5 * 60_000,
    queryFn: () => fetchPacks(),
  });
}

export function useUnlockedPacks() {
  const { user, loading } = useAuth();
  return useQuery<string[]>({
    queryKey: ["unlocked-packs", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("unlocked_packs")
        .select("pack_id");
      if (error) throw new Error(error.message);
      return (data ?? []).map((u: { pack_id: string }) => u.pack_id);
    },
  });
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}