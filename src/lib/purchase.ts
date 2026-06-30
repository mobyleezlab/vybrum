import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startPurchase, listMyPendingPurchases } from "@/lib/purchase.functions";
import { useAuth } from "@/lib/auth-context";

const ERROR_MAP: Record<string, string> = {
  not_authenticated: "Faça login para comprar créditos.",
  account_disabled: "Sua conta está desabilitada.",
  package_not_found_or_inactive: "Pacote indisponível.",
};

export function useStartPurchase() {
  const fn = useServerFn(startPurchase);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { package_id: string; google_purchase_token?: string | null }) =>
      fn({ data: input }),
    onSuccess: () => {
      toast.success("Compra iniciada. Aguardando confirmação do Google Play.");
      qc.invalidateQueries({ queryKey: ["pending-purchases"] });
    },
    onError: (e) => {
      const msg = (e as Error).message;
      toast.error(ERROR_MAP[msg] ?? msg ?? "Não foi possível iniciar a compra.");
    },
  });
}

export function usePendingPurchases() {
  const { user, loading } = useAuth();
  const fn = useServerFn(listMyPendingPurchases);
  return useQuery({
    queryKey: ["pending-purchases", user?.id ?? "anon"],
    enabled: !loading && !!user,
    staleTime: 15_000,
    queryFn: () => fn(),
  });
}

export function splitCredits(pkg: { credits: number; bonus_credits: number }) {
  const base = pkg.credits ?? 0;
  const bonus = pkg.bonus_credits ?? 0;
  return { base, bonus, total: base + bonus };
}