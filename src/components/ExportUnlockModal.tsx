import { X, Lock, Diamond } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { useCreditBalance } from "@/lib/credits";
import { useUnlockExport } from "@/lib/export-unlock";

interface Props {
  open: boolean;
  onClose: () => void;
  modelCode: string | undefined;
  onUnlocked?: () => void;
}

const EXPORT_COST = 5;

export function ExportUnlockModal({ open, onClose, modelCode, onUnlocked }: Props) {
  useDialogA11y(open, onClose);
  const { data: balance } = useCreditBalance();
  const unlock = useUnlockExport();
  if (!open || !modelCode) return null;
  const saldo = balance?.balance ?? 0;
  const enough = saldo >= EXPORT_COST;

  const handle = async () => {
    const res = await unlock.mutateAsync(modelCode);
    if (("success" in res && res.success) ||
        ("error" in res && (res.error === "export_already_unlocked" || res.error === "export_already_included"))) {
      onUnlocked?.();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-unlock-title"
      className="fixed inset-0 z-50 flex items-end bg-black/70 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#68ed00]/15 text-[#68ed00]">
            <Lock className="h-5 w-5" />
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-1 text-[#888] hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 id="export-unlock-title" className="mt-4 text-lg font-semibold text-white">
          Desbloquear exportação premium
        </h2>
        <p className="mt-1 text-sm text-[#888]">
          Por apenas {EXPORT_COST} créditos, libere para sempre PNG HD (4K), SVG vetorial e PDF
          neste modelo.
        </p>

        <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#888]">Seu saldo</span>
            <span className="flex items-center gap-1 font-semibold text-white">
              <Diamond className="h-3.5 w-3.5 text-[#68ed00]" />
              <span className="tabular-nums">{saldo}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[#888]">Custo</span>
            <span className="flex items-center gap-1 font-semibold text-[#68ed00]">
              <Diamond className="h-3.5 w-3.5" />
              <span className="tabular-nums">{EXPORT_COST}</span>
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {enough ? (
            <button
              type="button"
              disabled={unlock.isPending}
              onClick={handle}
              className="press flex-1 rounded-xl bg-[#68ed00] py-3 text-center text-sm font-bold text-black hover:opacity-90 disabled:opacity-60"
            >
              {unlock.isPending ? "Processando…" : `Desbloquear por ${EXPORT_COST} créditos`}
            </button>
          ) : (
            <Link
              to="/creditos"
              onClick={onClose}
              className="press flex-1 rounded-xl bg-[#68ed00] py-3 text-center text-sm font-bold text-black hover:opacity-90"
            >
              Comprar créditos
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-3 text-sm font-medium text-[#888] hover:bg-[#1a1a1a] hover:text-white"
          >
            Agora não
          </button>
        </div>

        {!enough && (
          <p className="mt-3 text-center text-xs text-[#888]">
            Você precisa de mais {EXPORT_COST - saldo} crédito{EXPORT_COST - saldo === 1 ? "" : "s"}.
          </p>
        )}
      </div>
    </div>
  );
}