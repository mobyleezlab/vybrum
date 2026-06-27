import { useRouter, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

interface BackButtonProps {
  fallback?: string;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
  onBeforeBack?: (proceed: () => void) => boolean | void;
}

/**
 * Botão "voltar" que usa o histórico do navegador para retornar à tela anterior.
 * Quando não há histórico (deep link, primeira tela), usa `fallback` (default: "/").
 */
export function BackButton({
  fallback = "/",
  className = "press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]",
  ariaLabel = "Voltar",
  children,
  onBeforeBack,
}: BackButtonProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const doBack = () => {
    const canGoBack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer !== "";
    // Sempre tenta voltar; se houver pelo menos uma entrada, o navegador volta.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: fallback });
    }
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onBeforeBack) {
      const handled = onBeforeBack(doBack);
      if (handled) return;
    }
    doBack();
  };

  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={className}>
      {children ?? <ChevronLeft className="h-6 w-6" />}
    </button>
  );
}