import { X, Sparkles, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FEATURE_LABEL, type Feature } from "@/lib/feature-gate";
import { useUserShields } from "@/lib/shields";

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: Feature;
}

export function UnlockSheet({ open, onClose, feature }: Props) {
  const { data: shields } = useUserShields();
  const hasShield = (shields?.length ?? 0) > 0;

  if (!open) return null;
  const title = feature ? FEATURE_LABEL[feature] : "Recurso exclusivo";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#2196F3] to-[#8B00E8] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {hasShield
            ? "Com o escudo do seu time já adicionado, libere tudo permanentemente."
            : "Desbloqueie qualquer template e tenha acesso completo a todos os recursos."}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-neutral-700">
          {[
            "Exportar SVG / PDF / PNG HD",
            "Até 10 escudos com reposicionamento",
            "Patrocinadores e fontes premium",
            "Goleiro separado e kit de time",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#2196F3]" /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-2">
          <Link
            to="/creditos"
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#2196F3] py-3 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            Ver créditos
          </Link>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}