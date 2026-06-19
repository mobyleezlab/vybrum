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
      const { data, error } = await (supabase as any)
        .from("user_shields")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as UserShield[];
      // Bucket is private — refresh signed URLs for each shield.
      const signed = await Promise.all(
        rows.map(async (r) => {
          const path = extractShieldPath(r.image_url);
          if (!path) return r;
          const { data: s } = await supabase.storage
            .from("user-shields")
            .createSignedUrl(path, 60 * 60);
          return s?.signedUrl ? { ...r, image_url: s.signedUrl } : r;
        }),
      );
      return signed;
    },
  });
}

/** Single shield per user (or null). Always returns a fresh signed URL. */
export function useCurrentUserShield() {
  const { user, loading } = useAuth();
  return useQuery<UserShield | null>({
    queryKey: ["user-shield", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_shields")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const row = data as UserShield;
      const path = extractShieldPath(row.image_url);
      if (!path) return row;
      const { data: s } = await supabase.storage
        .from("user-shields")
        .createSignedUrl(path, 60 * 60);
      return s?.signedUrl ? { ...row, image_url: s.signedUrl } : row;
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
      // Single shield per user — remove the previous file from Storage before
      // uploading. The DB trigger already removes the old user_shields row on
      // insert, but the physical file must be cleaned up here.
      const { data: previous } = await (supabase as any)
        .from("user_shields")
        .select("image_url")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      const previousPath = previous?.image_url
        ? extractShieldPath(previous.image_url as string)
        : null;
      if (previousPath) {
        await supabase.storage.from("user-shields").remove([previousPath]);
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-shields")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: signed, error: signErr } = await supabase.storage
        .from("user-shields")
        .createSignedUrl(path, 60 * 60);
      if (signErr) throw new Error(signErr.message);
      const { data: row, error: dbErr } = await (supabase as any)
        .from("user_shields")
        .insert({ user_id: user.id, name: file.name.replace(/\.[^.]+$/, "") || "Meu Escudo", image_url: path })
        .select()
        .single();
      if (dbErr) throw new Error(dbErr.message);
      return { ...(row as UserShield), image_url: signed.signedUrl };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-shields"] });
      qc.invalidateQueries({ queryKey: ["user-shield"] });
    },
  });
}

export function useDeleteShield() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: UserShield) => {
      const path = extractShieldPath(s.image_url);
      if (path) await supabase.storage.from("user-shields").remove([path]);
      const { error } = await (supabase as any).from("user_shields").delete().eq("id", s.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-shields"] });
      qc.invalidateQueries({ queryKey: ["user-shield"] });
    },
  });
}

/** Remove the user's current (single) custom shield from Storage and DB. */
export function useDeleteCurrentShield() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login.");
      const { data: row } = await (supabase as any)
        .from("user_shields")
        .select("id,image_url")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!row) return;
      const path = extractShieldPath(row.image_url as string);
      if (path) await supabase.storage.from("user-shields").remove([path]);
      const { error } = await (supabase as any)
        .from("user_shields")
        .delete()
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-shields"] });
      qc.invalidateQueries({ queryKey: ["user-shield"] });
    },
  });
}

// Accepts either a stored bucket path (`<uid>/<id>.ext`) or a legacy full URL.
function extractShieldPath(value: string): string | null {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const idx = url.pathname.indexOf("/user-shields/");
    if (idx === -1) return null;
    return url.pathname.slice(idx + "/user-shields/".length);
  } catch {
    return null;
  }
}