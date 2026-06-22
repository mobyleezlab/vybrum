import { Lock, Shirt } from "lucide-react";
import { useModels, categoryBadge, canUseModel, type ModelRow } from "@/lib/models";

interface Props {
  selectedCode: string | null;
  onSelect: (m: ModelRow) => void;
}

export function ModelSelector({ selectedCode, onSelect }: Props) {
  const { data, isLoading, error } = useModels();

  if (isLoading) {
    return (
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-neutral-200" />
        ))}
      </div>
    );
  }
  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 -mx-1 overflow-x-auto pb-1">
      <div className="flex gap-2 px-1">
        {data.map((m) => {
          const badge = categoryBadge(m.category);
          const locked = !canUseModel(m);
          const active = selectedCode === m.code;
          return (
            <button
              key={m.code}
              onClick={() => onSelect(m)}
              className={[
                "relative shrink-0 w-20 rounded-xl border bg-white p-1.5 text-left transition",
                active ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" : "border-neutral-200 hover:border-neutral-300",
              ].join(" ")}
            >
              <div className="relative grid h-14 w-full place-items-center overflow-hidden rounded-lg bg-neutral-100">
                {m.thumbnail_url ? (
                  <img src={m.thumbnail_url} alt={m.name} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <Sparkles className="h-5 w-5 text-neutral-400" />
                )}
                {locked && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className={`absolute left-1 top-1 rounded-sm px-1 py-[1px] text-[8px] font-bold leading-none ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="mt-1 truncate text-[10px] font-medium text-neutral-700">{m.name}</div>
              {m.is_limited && m.days_remaining != null && m.days_remaining > 0 && (
                <div className="text-[9px] text-red-600">{m.days_remaining}d restantes</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}