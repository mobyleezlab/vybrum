import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ModelRow } from "@/lib/models";
import type { Pack } from "@/lib/credits";
import type { Database } from "@/integrations/supabase/types";

const MODEL_COLUMNS =
  "code,name,category,rarity_level,is_limited,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,drop_name,sort_order,sport";

function withPublicModelStatus(rows: Array<Record<string, unknown>>): ModelRow[] {
  const now = Date.now();
  return rows.map((row) => {
    const availableUntil = typeof row.available_until === "string" ? row.available_until : null;
    const untilTime = availableUntil ? new Date(availableUntil).getTime() : null;
    const isExpired = untilTime !== null ? untilTime < now : false;
    const daysRemaining =
      untilTime !== null && !isExpired ? Math.ceil((untilTime - now) / 86_400_000) : null;

    return {
      ...row,
      is_unlocked: row.category === "free",
      days_remaining: daysRemaining,
      is_expired: isExpired,
    } as ModelRow;
  });
}

function getPublicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public env vars");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export const listModelsPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<ModelRow[]> => {
    const { data, error } = await getPublicClient()
      .from("models")
      .select(MODEL_COLUMNS)
      .order("sort_order", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return withPublicModelStatus((data ?? []) as Array<Record<string, unknown>>);
  },
);

const paginatedSchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(48).default(24),
  category: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
});

export interface PaginatedModels {
  rows: ModelRow[];
  hasMore: boolean;
  nextOffset: number;
}

export const listModelsPaginated = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => paginatedSchema.parse(i))
  .handler(async ({ data }): Promise<PaginatedModels> => {
    const { offset, limit, category, search } = data;
    let q = getPublicClient()
      .from("models")
      .select(MODEL_COLUMNS)
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit);
    if (category && category !== "todos") q = q.eq("category", category);
    if (search && search.trim()) {
      const term = search.trim().replace(/[%_]/g, "");
      q = q.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Array<Record<string, unknown>>;
    const hasMore = list.length > limit;
    const trimmed = hasMore ? list.slice(0, limit) : list;
    return {
      rows: withPublicModelStatus(trimmed),
      hasMore,
      nextOffset: offset + trimmed.length,
    };
  });

const homeSectionsSchema = z.object({
  perSection: z.number().int().min(1).max(12).default(6),
});

const HOME_CATEGORIES = ["free", "pro", "premium", "elite", "rare"] as const;
export type HomeSectionKey = (typeof HOME_CATEGORIES)[number];
export type HomeSections = Record<HomeSectionKey, ModelRow[]>;

export const listModelsHomeSections = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => homeSectionsSchema.parse(i))
  .handler(async ({ data }): Promise<HomeSections> => {
    const sb = getPublicClient();
    const results = await Promise.all(
      HOME_CATEGORIES.map((cat) =>
        sb
          .from("models")
          .select(MODEL_COLUMNS)
          .eq("category", cat)
          .order("sort_order", { ascending: true })
          .limit(data.perSection),
      ),
    );
    const out = {} as HomeSections;
    HOME_CATEGORIES.forEach((cat, i) => {
      const res = results[i];
      if (res.error) throw new Error(res.error.message);
      out[cat] = withPublicModelStatus(
        (res.data ?? []) as Array<Record<string, unknown>>,
      );
    });
    return out;
  });

export const listPacksPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pack[]> => {
    const { data, error } = await getPublicClient()
      .from("packs")
      .select("*, pack_items(id,model_code,sort_order)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Pack[];
  },
);
