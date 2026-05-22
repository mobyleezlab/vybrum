import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface Entitlements {
  plan: string;
  isAdmin: boolean;
  hasAnyUnlock: boolean;
  unlockedTemplates: string[];
}

export function useEntitlements() {
  const { user, loading } = useAuth();
  return useQuery<Entitlements>({
    queryKey: ["entitlements", user?.id ?? "anon"],
    enabled: !loading,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return { plan: "guest", isAdmin: false, hasAnyUnlock: false, unlockedTemplates: [] };
      const [{ data: prof }, { data: unlocks }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        supabase.from("unlocked_templates").select("model_code"),
      ]);
      const plan = prof?.plan ?? "free";
      const codes = (unlocks ?? []).map((u: { model_code: string }) => u.model_code);
      return {
        plan,
        isAdmin: plan === "admin",
        hasAnyUnlock: codes.length > 0 || plan !== "free",
        unlockedTemplates: codes,
      };
    },
  });
}