import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface UserShield {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  is_default: boolean | null;
  created_at: string;
}

export const MAX_SHIELD_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_SHIELD_MIME = ["image/png", "image/jpeg", "image/svg+xml"];

export function useUserShields() {
  const { user, loading } = useAuth();
  return useQuery<UserShield[]>({
    queryKey: ["user-shields", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_shields")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as UserShield[];
    },
  });
}

export function useUploadShield() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<UserShield> => {
      if (!user) throw new Error("Faça login para enviar um escudo.");
      if (!ACCEPTED_SHIELD_MIME.includes(file.type)) {
        throw new Error("Formato inválido. Use PNG, JPG ou SVG.");
      }
      if (file.size > MAX_SHIELD_BYTES) {
        throw new Error("Arquivo maior que 2MB.");
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-shields")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("user-shields").getPublicUrl(path);
      const { data: row, error: dbErr } = await supabase
        .from("user_shields")
        .insert({ user_id: user.id, name: file.name.replace(/\.[^.]+$/, "") || "Meu Escudo", image_url: pub.publicUrl })
        .select()
        .single();
      if (dbErr) throw new Error(dbErr.message);
      return row as UserShield;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-shields"] }),
  });
}

export function useDeleteShield() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: UserShield) => {
      const url = new URL(s.image_url);
      const parts = url.pathname.split("/user-shields/");
      const path = parts[1];
      if (path) await supabase.storage.from("user-shields").remove([path]);
      const { error } = await (supabase as any).from("user_shields").delete().eq("id", s.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-shields"] }),
  });
}