import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdminModelRow = Database["public"]["Tables"]["models"]["Row"];

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any).rpc("is_admin", { uid: context.userId });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

export const adminListModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminModelRow[]> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data, error } = await sb
      .from("models")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminModelRow[];
  });

const modelSchema = z.object({
  code: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(1).max(80),
  category: z.enum(["free", "pro", "premium", "elite", "rare"]),
  sport: z.string().trim().min(1).max(40).default("futebol"),
  rarity_level: z.string().trim().max(40).default("common"),
  is_limited: z.boolean().default(false),
  is_premium: z.boolean().default(false),
  unlock_cost: z.number().int().min(0).nullable().optional(),
  buy_cost: z.number().int().min(0).nullable().optional(),
  drop_name: z.string().trim().max(80).nullable().optional(),
  available_until: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  thumbnail_url: z.string().url().nullable().optional(),
  svg_frente_url: z.string().url().nullable().optional(),
  svg_costas_url: z.string().url().nullable().optional(),
});
export type AdminModelInput = z.infer<typeof modelSchema>;

export const adminUpsertModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => modelSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("models").upsert(data, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(32) }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("models").delete().eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const uploadSchema = z.object({
  code: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/),
  kind: z.enum(["thumb", "frente", "costas"]),
  base64: z.string().min(8).max(8_000_000),
  contentType: z.string().min(3).max(80),
  filename: z.string().min(1).max(120),
});

export const adminUploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const ext = (data.filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${data.code}/${data.kind}-${Date.now()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error: upErr } = await sb.storage
      .from("model-svgs")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = sb.storage.from("model-svgs").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });