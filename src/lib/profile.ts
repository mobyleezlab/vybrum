import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface Avatar {
  id: string;
  name: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_id: string | null;
  plan: string;
  created_at: string;
}

export function useProfile() {
  const { user, loading } = useAuth();
  return useQuery<Profile | null>({
    queryKey: ["profile", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, avatar_id, plan, created_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Profile | null) ?? null;
    },
  });
}

export function useAvatars() {
  return useQuery<Avatar[]>({
    queryKey: ["avatars", "active"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("avatars")
        .select("id, name, image_url, active, sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Avatar[];
    },
  });
}

export function useAvatarById(id: string | null | undefined) {
  const { data: avatars } = useAvatars();
  if (!id || !avatars) return null;
  return avatars.find((a) => a.id === id) ?? null;
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { full_name?: string | null; avatar_id?: string | null }) => {
      if (!user) throw new Error("not_authenticated");
      const patch: Record<string, unknown> = { id: user.id, email: user.email ?? null };
      if (input.full_name !== undefined) patch.full_name = input.full_name?.trim() || null;
      if (input.avatar_id !== undefined) patch.avatar_id = input.avatar_id;
      const { error } = await (supabase as any)
        .from("profiles")
        .upsert(patch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}