import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startSchema = z.object({
  package_id: z.string().uuid(),
  google_purchase_token: z.string().min(1).max(500).optional().nullable(),
});

export const startPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => startSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await (context.supabase as any).rpc("start_purchase", {
      p_package_id: data.package_id,
      p_google_purchase_token: data.google_purchase_token ?? null,
    });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result as { success: boolean; purchase_id: string; status: string };
  });

export type PendingPurchase = {
  id: string;
  package_id: string;
  base_credits: number;
  bonus_credits: number;
  price_brl: number;
  status: string;
  created_at: string;
};

export const listMyPendingPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PendingPurchase[]> => {
    const { data, error } = await (context.supabase as any)
      .from("credit_purchases")
      .select("id,package_id,base_credits,bonus_credits,price_brl,status,created_at")
      .eq("user_id", context.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PendingPurchase[];
  });