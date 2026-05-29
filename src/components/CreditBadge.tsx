import { Diamond } from "lucide-react";
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
      className="press flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-1 text-xs font-semibold text-white"
      aria-label={`${balance} créditos`}
    >
      <Diamond className="h-3.5 w-3.5 text-[#68ed00]" />
      <span className="tabular-nums">{balance}</span>
    </Link>
  );
}