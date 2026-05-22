import { Coins } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCreditBalance } from "@/lib/credits";
import { useAuth } from "@/lib/auth-context";

export function CreditBadge() {
  const { user } = useAuth();
  const { data } = useCreditBalance();
  if (!user) return null;
  const balance = data?.balance ?? 0;
  return (
    <Link
      to="/creditos"
      className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200"
      aria-label={`${balance} créditos`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span className="tabular-nums">{balance}</span>
    </Link>
  );
}