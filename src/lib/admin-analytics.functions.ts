import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "");
  return String(error);
}

function isRlsRecursionError(error: unknown) {
  return errorMessage(error).includes('infinite recursion detected in policy');
}

const analyticsSetupMessage =
  "As policies de admin no Supabase precisam ser atualizadas. Aplique a migration de Analytics para liberar a leitura.";

async function resolveAdminClient(authSb: any, userId: string) {
  // Verify the caller is an admin BEFORE returning the service-role client.
  const { data: profile, error: profileError } = await authSb
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(errorMessage(profileError));
  if (!profile || profile.plan !== "admin") {
    throw new Error("Forbidden: admin only");
  }
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin as any;
  }
  return authSb;
}

export type AdminAnalyticsSummary = {
  setupError?: string | null;
  range_days: number;
  totals: {
    total_users: number;
    new_users: number;
    active_users: number;
    kits_created: number;
    shields_created: number;
    templates_unlocked: number;
    credits_earned: number;
    credits_spent: number;
  };
  plans: Array<{ plan: string; count: number }>;
  daily_signups: Array<{ date: string; count: number }>;
  daily_kits: Array<{ date: string; count: number }>;
  top_models: Array<{ model_code: string; name: string | null; count: number }>;
  top_unlocked: Array<{ model_code: string; name: string | null; count: number; credits: number }>;
  ledger_by_type: Array<{ type: string; in: number; out: number }>;
};

const inputSchema = z.object({ rangeDays: z.number().int().min(7).max(365).default(30) });

function emptyDaily(rangeDays: number) {
  const now = new Date();
  return Array.from({ length: rangeDays }, (_, i) => {
    const d = new Date(now.getTime() - (rangeDays - i - 1) * 86400_000);
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
}

function emptySummary(rangeDays: number, setupError: string | null = null): AdminAnalyticsSummary {
  return {
    setupError,
    range_days: rangeDays,
    totals: { total_users: 0, new_users: 0, active_users: 0, kits_created: 0, shields_created: 0, templates_unlocked: 0, credits_earned: 0, credits_spent: 0 },
    plans: [],
    daily_signups: emptyDaily(rangeDays),
    daily_kits: emptyDaily(rangeDays),
    top_models: [],
    top_unlocked: [],
    ledger_by_type: [],
  };
}

export const adminAnalyticsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => inputSchema.parse(i))
  .handler(async ({ data, context }): Promise<AdminAnalyticsSummary> => {
    let sb: any;
    try {
      sb = await resolveAdminClient(context.supabase as any, context.userId);
    } catch (error) {
      if (isRlsRecursionError(error)) return emptySummary(data.rangeDays, analyticsSetupMessage);
      throw error;
    }

    const now = new Date();
    const since = new Date(now.getTime() - data.rangeDays * 86400_000);
    const sinceIso = since.toISOString();

    const [
      profilesAllRes,
      profilesNewRes,
      kitsRes,
      shieldsRes,
      unlockedRes,
      ledgerRes,
      modelsRes,
    ] = await Promise.all([
      sb.from("profiles").select("plan,last_seen_at"),
      sb.from("profiles").select("created_at").gte("created_at", sinceIso),
      sb.from("kits").select("created_at,model_code").gte("created_at", sinceIso),
      sb.from("user_shields").select("id").gte("created_at", sinceIso),
      sb.from("unlocked_templates").select("model_code,credits_spent,created_at").gte("created_at", sinceIso),
      sb.from("credit_ledger").select("amount,type,created_at").gte("created_at", sinceIso),
      sb.from("models").select("code,name"),
    ]);

    for (const r of [profilesAllRes, profilesNewRes, kitsRes, shieldsRes, unlockedRes, ledgerRes, modelsRes]) {
      if (r.error) {
        if (isRlsRecursionError(r.error)) return emptySummary(data.rangeDays, analyticsSetupMessage);
        if ((r.error as any).code === "42501" || /permission denied/i.test(errorMessage(r.error))) {
          return emptySummary(data.rangeDays, analyticsSetupMessage);
        }
        throw new Error(errorMessage(r.error));
      }
    }

    const profilesAll: any[] = profilesAllRes.data ?? [];
    const profilesNew: any[] = profilesNewRes.data ?? [];
    const kits: any[] = kitsRes.data ?? [];
    const shields: any[] = shieldsRes.data ?? [];
    const unlocked: any[] = unlockedRes.data ?? [];
    const ledger: any[] = ledgerRes.data ?? [];
    const modelMap = new Map<string, string>((modelsRes.data ?? []).map((m: any) => [m.code, m.name]));

    const activeUsers = profilesAll.filter((p) => p.last_seen_at && new Date(p.last_seen_at) >= since).length;

    const planAgg = new Map<string, number>();
    for (const p of profilesAll) planAgg.set(p.plan, (planAgg.get(p.plan) ?? 0) + 1);
    const plans = Array.from(planAgg.entries()).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);

    const bucket = (rows: any[], field: string) => {
      const m = new Map<string, number>();
      for (let i = data.rangeDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000);
        m.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of rows) {
        const key = new Date(r[field]).toISOString().slice(0, 10);
        if (m.has(key)) m.set(key, (m.get(key) ?? 0) + 1);
      }
      return Array.from(m.entries()).map(([date, count]) => ({ date, count }));
    };

    const daily_signups = bucket(profilesNew, "created_at");
    const daily_kits = bucket(kits, "created_at");

    const kitModelAgg = new Map<string, number>();
    for (const k of kits) kitModelAgg.set(k.model_code, (kitModelAgg.get(k.model_code) ?? 0) + 1);
    const top_models = Array.from(kitModelAgg.entries())
      .map(([model_code, count]) => ({ model_code, name: modelMap.get(model_code) ?? null, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const unlockedAgg = new Map<string, { count: number; credits: number }>();
    for (const u of unlocked) {
      const cur = unlockedAgg.get(u.model_code) ?? { count: 0, credits: 0 };
      cur.count += 1;
      cur.credits += Number(u.credits_spent ?? 0);
      unlockedAgg.set(u.model_code, cur);
    }
    const top_unlocked = Array.from(unlockedAgg.entries())
      .map(([model_code, v]) => ({ model_code, name: modelMap.get(model_code) ?? null, count: v.count, credits: v.credits }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    let credits_earned = 0;
    let credits_spent = 0;
    const ledgerTypes = new Map<string, { in: number; out: number }>();
    for (const l of ledger) {
      const amt = Number(l.amount ?? 0);
      const cur = ledgerTypes.get(l.type) ?? { in: 0, out: 0 };
      if (amt >= 0) { credits_earned += amt; cur.in += amt; }
      else { credits_spent += -amt; cur.out += -amt; }
      ledgerTypes.set(l.type, cur);
    }
    const ledger_by_type = Array.from(ledgerTypes.entries())
      .map(([type, v]) => ({ type, in: v.in, out: v.out }))
      .sort((a, b) => (b.in + b.out) - (a.in + a.out))
      .slice(0, 8);

    return {
      setupError: null,
      range_days: data.rangeDays,
      totals: {
        total_users: profilesAll.length,
        new_users: profilesNew.length,
        active_users: activeUsers,
        kits_created: kits.length,
        shields_created: shields.length,
        templates_unlocked: unlocked.length,
        credits_earned,
        credits_spent,
      },
      plans,
      daily_signups,
      daily_kits,
      top_models,
      top_unlocked,
      ledger_by_type,
    };
  });