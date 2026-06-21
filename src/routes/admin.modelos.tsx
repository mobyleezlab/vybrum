import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Pencil, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminListModels,
  adminUpsertModel,
  adminDeleteModel,
  adminUploadAsset,
  type AdminModelInput,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/modelos")({
  ssr: false,
  component: AdminModelosPage,
});

const CATEGORIES = ["free", "pro", "premium", "elite", "rare"] as const;

const EMPTY: AdminModelInput = {
  code: "",
  name: "",
  category: "free",
  sport: "futebol",
  rarity_level: "common",
  is_limited: false,
  is_premium: false,
  unlock_cost: 0,
  buy_cost: null,
  drop_name: null,
  available_until: null,
  sort_order: 0,
  thumbnail_url: null,
  svg_frente_url: null,
  svg_costas_url: null,
};

function AdminModelosPage() {
  const listFn = useServerFn(adminListModels);
  const models = useQuery({
    queryKey: ["admin", "models"],
    queryFn: () => listFn(),
  });
  const [editing, setEditing] = useState<AdminModelInput | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[#888]">
          {models.data?.length ?? 0} modelo(s) cadastrado(s).
        </p>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="press inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#68ed00] px-3 text-xs font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo modelo
        </button>
      </div>

      {models.isLoading ? (
        <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-white" />
      ) : !models.data?.length ? (
        <div className="mt-10 text-center text-sm text-[#888]">Nenhum modelo cadastrado. Clique em "Novo modelo".</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {models.data.map((m) => (
            <button
              key={m.code}
              onClick={() => setEditing({
                code: m.code, name: m.name, category: (m.category as AdminModelInput["category"]) ?? "free",
                sport: m.sport ?? "futebol", rarity_level: m.rarity_level ?? "common",
                is_limited: !!m.is_limited, is_premium: !!m.is_premium,
                unlock_cost: m.unlock_cost, buy_cost: m.buy_cost,
                drop_name: m.drop_name, available_until: m.available_until,
                sort_order: m.sort_order ?? 0,
                thumbnail_url: m.thumbnail_url, svg_frente_url: m.svg_frente_url, svg_costas_url: m.svg_costas_url,
              })}
              className="press overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] text-left"
            >
              <div className="grid aspect-[4/5] place-items-center bg-[#161616]">
                {m.thumbnail_url
                  ? <img src={m.thumbnail_url} alt={m.name} loading="lazy" className="h-full w-full object-contain p-2" />
                  : <span className="text-[#333]">—</span>}
              </div>
              <div className="border-t border-[#2a2a2a] px-2 py-2">
                <div className="text-[10px] font-bold uppercase text-[#666]">{m.code}</div>
                <div className="truncate text-xs font-semibold">{m.name}</div>
                <div className="mt-0.5 text-[10px] uppercase text-[#888]">{m.category}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && <ModelEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ModelEditor({ initial, onClose }: { initial: AdminModelInput; onClose: () => void }) {
  const qc = useQueryClient();
  const upsertFn = useServerFn(adminUpsertModel);
  const deleteFn = useServerFn(adminDeleteModel);
  const uploadFn = useServerFn(adminUploadAsset);

  const [m, setM] = useState<AdminModelInput>(initial);
  const isNew = !initial.code || !initial.name;

  const save = useMutation({
    mutationFn: () => upsertFn({ data: m }),
    onSuccess: () => {
      toast.success("Modelo salvo.");
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      qc.invalidateQueries({ queryKey: ["models", "public"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { code: m.code } }),
    onSuccess: () => {
      toast.success("Modelo removido.");
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      qc.invalidateQueries({ queryKey: ["models", "public"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function update<K extends keyof AdminModelInput>(k: K, v: AdminModelInput[K]) {
    setM((prev) => ({ ...prev, [k]: v }));
  }

  async function handleUpload(kind: "thumb" | "frente" | "costas", file: File) {
    if (!m.code) { toast.error("Defina o código primeiro."); return; }
    const max = kind === "thumb" ? 2_000_000 : 4_000_000;
    if (file.size > max) { toast.error(`Arquivo muito grande (máx ${Math.round(max / 1_000_000)}MB).`); return; }
    try {
      const base64 = await fileToBase64(file);
      const res = await uploadFn({ data: {
        code: m.code, kind, base64, contentType: file.type || "application/octet-stream", filename: file.name,
      } });
      const url = res.url;
      if (kind === "thumb") update("thumbnail_url", url);
      if (kind === "frente") update("svg_frente_url", url);
      if (kind === "costas") update("svg_costas_url", url);
      toast.success("Upload concluído.");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 sm:place-items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{isNew ? "Novo modelo" : `Editar · ${initial.code}`}</h2>
          <button onClick={onClose} className="text-xs text-[#888]">Fechar</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código">
            <input value={m.code} onChange={(e) => update("code", e.target.value.toUpperCase())} disabled={!isNew}
              placeholder="VY010" maxLength={32} className="adm-input" />
          </Field>
          <Field label="Nome">
            <input value={m.name} onChange={(e) => update("name", e.target.value)} maxLength={80} className="adm-input" />
          </Field>
          <Field label="Categoria">
            <select value={m.category} onChange={(e) => update("category", e.target.value as AdminModelInput["category"])} className="adm-input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Esporte">
            <input value={m.sport} onChange={(e) => update("sport", e.target.value)} className="adm-input" />
          </Field>
          <Field label="Custo desbloqueio (créditos)">
            <input type="number" value={m.unlock_cost ?? 0} onChange={(e) => update("unlock_cost", Number(e.target.value))} className="adm-input" />
          </Field>
          <Field label="Ordem">
            <input type="number" value={m.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} className="adm-input" />
          </Field>
          <Field label="Drop (nome opcional)">
            <input value={m.drop_name ?? ""} onChange={(e) => update("drop_name", e.target.value || null)} className="adm-input" />
          </Field>
          <Field label="Disponível até">
            <input type="date" value={m.available_until?.slice(0, 10) ?? ""} onChange={(e) => update("available_until", e.target.value ? new Date(e.target.value).toISOString() : null)} className="adm-input" />
          </Field>
          <Field label="Limitado"><Toggle value={!!m.is_limited} onChange={(v) => update("is_limited", v)} /></Field>
          <Field label="Premium"><Toggle value={!!m.is_premium} onChange={(v) => update("is_premium", v)} /></Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AssetUpload label="Thumbnail" url={m.thumbnail_url} accept="image/*" onPick={(f) => handleUpload("thumb", f)} />
          <AssetUpload label="SVG Frente" url={m.svg_frente_url} accept="image/svg+xml,.svg" onPick={(f) => handleUpload("frente", f)} />
          <AssetUpload label="SVG Costas" url={m.svg_costas_url} accept="image/svg+xml,.svg" onPick={(f) => handleUpload("costas", f)} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {!isNew ? (
            <button onClick={() => { if (confirm(`Remover "${m.name}"?`)) del.mutate(); }} disabled={del.isPending}
              className="press inline-flex h-11 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-xs font-bold text-red-300">
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          ) : <span />}
          <button onClick={() => save.mutate()} disabled={save.isPending || !m.code || !m.name}
            className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#68ed00] px-5 text-sm font-bold text-black disabled:opacity-50">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>

      <style>{`
        .adm-input { width:100%; height:40px; border-radius:8px; border:1px solid #2a2a2a; background:#161616; color:#fff; padding:0 10px; font-size:13px; }
        .adm-input:focus { outline:none; border-color:#68ed00; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#888]">
      {label}
      <div className="mt-1 normal-case">{children}</div>
    </label>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="press h-10 w-full rounded-lg border text-xs font-semibold"
      style={{
        borderColor: value ? "#68ed00" : "#2a2a2a",
        background: value ? "#68ed0022" : "#161616",
        color: value ? "#68ed00" : "#888",
      }}>
      {value ? "Sim" : "Não"}
    </button>
  );
}

function AssetUpload({ label, url, accept, onPick }: { label: string; url: string | null | undefined; accept: string; onPick: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-2">
      <div className="mb-1 text-[11px] font-semibold uppercase text-[#888]">{label}</div>
      <div className="grid aspect-square place-items-center rounded-md bg-[#0f0f0f]">
        {url ? <img src={url} alt={label} className="max-h-full max-w-full object-contain p-2" /> : <span className="text-[10px] text-[#444]">sem arquivo</span>}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true);
          try { await onPick(f); } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
        }} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
        className="press mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#1a1a1a] text-[11px] font-semibold text-white">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {url ? "Trocar" : "Enviar"}
      </button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const result = r.result as string; resolve(result.split(",")[1] ?? ""); };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
