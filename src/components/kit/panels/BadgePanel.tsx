import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Lock, X, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Slider } from "@/components/ui/slider";
import { BADGE_PRESETS, type BadgeLayer } from "@/lib/kit-state";
import { useAuth } from "@/lib/auth-context";
import { useEntitlements } from "@/lib/entitlements";
import {
  useUserShields, useUploadShield, useDeleteShield,
  MAX_SHIELD_BYTES, ACCEPTED_SHIELD_MIME,
} from "@/lib/shields";
import { FREE_SHIELD_LIMIT } from "@/lib/feature-gate";
import { UnlockSheet } from "@/components/UnlockSheet";

export function BadgePanel({
  layer, onChange, label,
}: {
  layer: BadgeLayer;
  onChange: (l: BadgeLayer) => void;
  label: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ent } = useEntitlements();
  const { data: shields } = useUserShields();
  const upload = useUploadShield();
  const removeShield = useDeleteShield();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const unlocked = !!ent?.hasAnyUnlock;
  const shieldCount = shields?.length ?? 0;
  const limit = unlocked ? 10 : FREE_SHIELD_LIMIT;
  const atLimit = shieldCount >= limit;

  useEffect(() => {
    if (!user) return;
    const key = `onb-shield-${user.id}`;
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      setShowTip(true);
      localStorage.setItem(key, "1");
      const t = setTimeout(() => setShowTip(false), 6000);
      return () => clearTimeout(t);
    }
  }, [user]);

  const onFile = (f: File | null) => {
    if (!f) return;
    setError(null);
    if (!user) { navigate({ to: "/login", search: { redirect: "/" } }); return; }
    if (!ACCEPTED_SHIELD_MIME.includes(f.type)) { setError("Use PNG, JPG ou SVG."); return; }
    if (f.size > MAX_SHIELD_BYTES) { setError("Máximo 2MB."); return; }
    if (atLimit && !unlocked) { setUnlockOpen(true); return; }
    upload.mutate(f, {
      onSuccess: (s) => onChange({ ...layer, src: s.image_url }),
      onError: (e) => setError(e instanceof Error ? e.message : "Falha no upload."),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{label}</p>
        {showTip && (
          <div className="relative ml-2 max-w-[220px] rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
            Adicione o escudo do seu time! É gratuito 🎽
            <button onClick={() => setShowTip(false)} className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-neutral-700 text-white">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Meus escudos</p>
          <span className="text-[10px] text-neutral-400">{shieldCount}/{limit}</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {(shields ?? []).map((s) => {
            const sel = layer.src === s.image_url;
            return (
              <div key={s.id} className="relative">
                <button
                  onClick={() => onChange({ ...layer, src: s.image_url })}
                  className={[
                    "aspect-square w-full rounded-lg border bg-white p-1 transition",
                    sel ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                >
                  <img src={s.image_url} alt={s.name} className="h-full w-full object-contain" />
                </button>
                <button
                  onClick={() => removeShield.mutate(s)}
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-neutral-900 text-white shadow"
                  aria-label="Remover escudo"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => (atLimit && !unlocked ? setUnlockOpen(true) : fileRef.current?.click())}
            disabled={upload.isPending}
            className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition hover:border-[#2196F3] hover:text-[#2196F3] disabled:opacity-50"
            aria-label="Adicionar escudo"
          >
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
        {atLimit && !unlocked && (
          <p className="mt-2 text-[11px] text-neutral-500">
            Desbloqueie qualquer template para salvar até 10 escudos.
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">Biblioteca premium</p>
          {!unlocked && <Lock className="h-3 w-3 text-neutral-400" />}
        </div>
        <div className={["grid grid-cols-6 gap-2", !unlocked ? "opacity-60" : ""].join(" ")}>
          {BADGE_PRESETS.map((b) => {
            const sel = layer.src === b.src;
            return (
              <button
                key={b.id}
                onClick={() => (unlocked ? onChange({ ...layer, src: b.src }) : setUnlockOpen(true))}
                className={[
                  "relative aspect-square rounded-lg border bg-white p-1 transition",
                  sel ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" : "border-neutral-200 hover:border-neutral-300",
                ].join(" ")}
              >
                <img src={b.src} alt={b.name} className="h-full w-full object-contain" />
                {!unlocked && (
                  <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/30">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...layer, src: null })}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
        >
          <Trash2 className="h-4 w-4" /> Remover do uniforme
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          <span>Tamanho</span>
          <span className="tabular-nums">{Math.round(layer.size * 100)}%</span>
        </div>
        <Slider
          value={[layer.size * 100]} min={50} max={250} step={5}
          disabled={!unlocked}
          onValueChange={(v) => onChange({ ...layer, size: v[0] / 100 })}
        />
        {!unlocked && (
          <button
            onClick={() => setUnlockOpen(true)}
            className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600"
          >
            <Lock className="h-3 w-3" /> Reposicionamento e tamanho livres no premium
          </button>
        )}
      </div>

      <UnlockSheet open={unlockOpen} onClose={() => setUnlockOpen(false)} feature="shield-library" />
    </div>
  );
}