import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { KitState } from "@/lib/kit-state";
import type { Database } from "@/integrations/supabase/types";
type Json = Database["public"]["Tables"]["kits"]["Insert"]["colors"];

export interface KitRow {
  id: string;
  user_id: string;
  name: string;
  model_code: string;
  colors: unknown;
  player_name: string;
  player_number: string;
  font_selected: string;
  shield_selected: string;
  is_premium_model: boolean;
  created_at: string;
  updated_at: string;
}

const KIT_LIMIT = 50;

export function useKits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["kits", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<KitRow[]> => {
      const { data, error } = await supabase
        .from("kits")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KitRow[];
    },
  });
}

export function useKit(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["kit", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<KitRow | null> => {
      const { data, error } = await supabase
        .from("kits")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as KitRow | null;
    },
  });
}

export interface SaveKitInput {
  id?: string;
  name: string;
  model_code: string;
  state: KitState;
  is_premium_model: boolean;
}

export function useSaveKit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveKitInput): Promise<KitRow> => {
      if (!user) throw new Error("not_authenticated");

      // Verifica limite apenas em criação (sem id existente)
      if (!input.id) {
        const { count, error: countErr } = await supabase
          .from("kits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (countErr) throw countErr;
        if ((count ?? 0) >= KIT_LIMIT) throw new Error("kit_limit_reached");
      }

      const payload = {
        ...(input.id ? { id: input.id } : {}),
        user_id: user.id,
        name: input.name,
        model_code: input.model_code,
        colors: input.state as unknown as Json,
        player_name: input.state.texts.nome.value,
        player_number: input.state.texts.numero.value,
        font_selected: input.state.texts.nome.font,
        shield_selected: input.state.escudo.src ?? "",
        is_premium_model: input.is_premium_model,
      };

      const { data, error } = await supabase
        .from("kits")
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as KitRow;
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["kits", user?.id] });
      qc.invalidateQueries({ queryKey: ["kit", saved.id] });
      qc.setQueryData(["kit", saved.id], saved);
    },
  });
}

export function useDeleteKit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("not_authenticated");
      const { error } = await supabase
        .from("kits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kits", user?.id] });
    },
  });
}

export function kitStateFromRow(row: KitRow): KitState | null {
  try {
    if (row.colors && typeof row.colors === "object") {
      return row.colors as KitState;
    }
    return null;
  } catch {
    return null;
  }
}

export { KIT_LIMIT };