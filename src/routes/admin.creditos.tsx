import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, Diamond, Save, X, Layers, Search } from "lucide-react";
import { toast } from "sonner";
import {
  adminListCreditPackages,
  adminUpsertCreditPackage,
  adminDeleteCreditPackage,
  adminListPacks,
  adminUpsertPack,
  adminDeletePack,
  adminListModelCodes,
  adminBulkUpdateUnlockCost,
  type AdminCreditPackage,
  type AdminCreditPackageInput,
  type AdminPack,
  type AdminPackInput,
} from "@/lib/admin-credits.functions";

export const Route = createFileRoute("/admin/creditos")({
  ssr: false,
  component: Page,
});

type Tab = "packages" | "packs" | "bulk";

const CATEGORIES = ["free", "pro", "premium", "elite", "rare"] as const;

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Page() {
  const [tab, setTab] = useState<Tab>("packages");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {([
          { id: "packages", label: "Pacotes de Créditos", icon: Diamond },
          { id: "packs", label: "Drops / Coleções", icon: Package },
          { id: "bulk", label: "Custos em lote", icon: Layers },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="press inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
              style={{
                borderColor: active ? "#68ed00" : "#2a2a2a",
                background: active ? "#68ed0022" : "#0f0f0f",
                color: active ? "#68ed00" : "#bbb",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "packages" && <PackagesPanel />}
      {tab === "packs" && <PacksPanel />}
      {tab === "bulk" && <BulkPanel />}
    </div>
  );
}

// ===== Credit Packages =====

const EMPTY_PKG: AdminCreditPackageInput = {
  id: null,
  name: "",
  credits: 100,
  bonus_credits: 0,
  price_brl: 9.9,
  sort_order: 0,
  is_active: true,
  google_product_id: null,
};

function PackagesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListCreditPackages);
  const upsertFn = useServerFn(adminUpsertCreditPackage);
  const deleteFn = useServerFn(adminDeleteCreditPackage);
  const list = useQuery({ queryKey: ["admin", "credit_packages"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<AdminCreditPackageInput | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Pacote removido"); qc.invalidateQueries({ queryKey: ["admin", "credit_packages"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const save = useMutation({
    mutationFn: (input: AdminCreditPackageInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Pacote salvo");
      qc.invalidateQueries({ queryKey: ["admin", "credit_packages"] });
      setEditing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-[#888]">{list.data?.length ?? 0} pacote(s) cadastrado(s).</p>
        <button
          onClick={() => setEditing({ ...EMPTY_PKG })}
          className="press inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#68ed00] px-3 text-xs font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo pacote
        </button>
      </div>

      {list.isLoading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full text-xs">
            <thead className="bg-[#0c0c0c] text-[10px] uppercase text-[#888]">
              <tr>
                <th className="px-3 py-2 text-left">Nome</th>
                <th className="px-3 py-2 text-right">Créditos</th>
                <th className="px-3 py-2 text-right">Bônus</th>
                <th className="px-3 py-2 text-right">Preço</th>
                <th className="px-3 py-2 text-right">Ordem</th>
                <th className="px-3 py-2 text-center">Ativo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((p) => (
                <PackageRow key={p.id} pkg={p} onEdit={() => setEditing(toPkgInput(p))} onDelete={() => {
                  if (confirm(`Remover o pacote "${p.name}"?`)) del.mutate(p.id);
                }} />
              ))}
              {!list.data?.length && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-[#666]">Nenhum pacote cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PackageEditor
          value={editing}
          onClose={() => setEditing(null)}
          onChange={setEditing}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function toPkgInput(p: AdminCreditPackage): AdminCreditPackageInput {
  return {
    id: p.id,
    name: p.name,
    credits: p.credits,
    bonus_credits: p.bonus_credits,
    price_brl: Number(p.price_brl),
    sort_order: p.sort_order,
    is_active: p.is_active,
    google_product_id: p.google_product_id,
  };
}

function PackageRow({ pkg, onEdit, onDelete }: { pkg: AdminCreditPackage; onEdit: () => void; onDelete: () => void }) {
  return (
    <tr className="border-t border-[#1a1a1a]">
      <td className="px-3 py-2 font-semibold text-white">{pkg.name}</td>
      <td className="px-3 py-2 text-right tabular-nums">{pkg.credits}</td>
      <td className="px-3 py-2 text-right tabular-nums text-[#68ed00]">+{pkg.bonus_credits}</td>
      <td className="px-3 py-2 text-right tabular-nums">{fmtBRL(Number(pkg.price_brl))}</td>
      <td className="px-3 py-2 text-right tabular-nums text-[#888]">{pkg.sort_order}</td>
      <td className="px-3 py-2 text-center">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: pkg.is_active ? "#68ed0022" : "#3a1f1f", color: pkg.is_active ? "#68ed00" : "#ff8888" }}>
          {pkg.is_active ? "ON" : "OFF"}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
          <button onClick={onEdit} className="press grid h-7 w-7 place-items-center rounded-md border border-[#2a2a2a] bg-[#1a1a1a]"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="press grid h-7 w-7 place-items-center rounded-md border border-[#4a1f1f] bg-[#2a0f0f] text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}

function PackageEditor({ value, onChange, onSave, onClose, saving }: {
  value: AdminCreditPackageInput;
  onChange: (v: AdminCreditPackageInput) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const setField = <K extends keyof AdminCreditPackageInput>(k: K, v: AdminCreditPackageInput[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">{value.id ? "Editar" : "Novo"} pacote</h3>
          <button onClick={onClose} className="press grid h-7 w-7 place-items-center rounded-md border border-[#2a2a2a]"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="Nome" className="col-span-2">
            <input value={value.name} onChange={(e) => setField("name", e.target.value)} className="input" />
          </Field>
          <Field label="Créditos">
            <input type="number" value={value.credits} onChange={(e) => setField("credits", Number(e.target.value))} className="input" />
          </Field>
          <Field label="Bônus">
            <input type="number" value={value.bonus_credits} onChange={(e) => setField("bonus_credits", Number(e.target.value))} className="input" />
          </Field>
          <Field label="Preço (BRL)">
            <input type="number" step="0.01" value={value.price_brl} onChange={(e) => setField("price_brl", Number(e.target.value))} className="input" />
          </Field>
          <Field label="Ordem">
            <input type="number" value={value.sort_order} onChange={(e) => setField("sort_order", Number(e.target.value))} className="input" />
          </Field>
          <Field label="Google Product ID" className="col-span-2">
            <input value={value.google_product_id ?? ""} onChange={(e) => setField("google_product_id", e.target.value || null)} className="input" />
          </Field>
          <label className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={value.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
            Ativo
          </label>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !value.name.trim()}
          className="press mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#68ed00] text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </button>
      </div>
      <style>{`.input { width: 100%; height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid #2a2a2a; background: #111; color: #fff; }`}</style>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#888]">{label}</span>
      {children}
    </label>
  );
}

// ===== Packs =====

const EMPTY_PACK: AdminPackInput = {
  id: null,
  name: "",
  description: null,
  category: "free",
  cost_credits: 0,
  original_value: 0,
  discount_pct: null,
  is_limited: false,
  is_active: true,
  available_until: null,
  thumbnail_url: null,
  sort_order: 0,
  model_codes: [],
};

function PacksPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListPacks);
  const upsertFn = useServerFn(adminUpsertPack);
  const deleteFn = useServerFn(adminDeletePack);
  const list = useQuery({ queryKey: ["admin", "packs"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<AdminPackInput | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Pack removido"); qc.invalidateQueries({ queryKey: ["admin", "packs"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const save = useMutation({
    mutationFn: (input: AdminPackInput) => upsertFn({ data: input }),
    onSuccess: () => { toast.success("Pack salvo"); qc.invalidateQueries({ queryKey: ["admin", "packs"] }); setEditing(null); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-[#888]">{list.data?.length ?? 0} pack(s) cadastrado(s).</p>
        <button
          onClick={() => setEditing({ ...EMPTY_PACK })}
          className="press inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#68ed00] px-3 text-xs font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo pack
        </button>
      </div>

      {list.isLoading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-[#1f1f1f] bg-[#0c0c0c] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{p.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#888]">{p.category} · {p.pack_items.length} item(s)</p>
                </div>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: p.is_active ? "#68ed0022" : "#3a1f1f", color: p.is_active ? "#68ed00" : "#ff8888" }}>
                  {p.is_active ? "ON" : "OFF"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-[#68ed00]"><Diamond className="h-3 w-3" />{p.cost_credits}</span>
                <span className="text-[#888]">de {p.original_value} cr</span>
                {p.discount_pct != null && <span className="rounded bg-[#1a1a1a] px-1.5 text-[10px] text-white">-{p.discount_pct}%</span>}
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <button onClick={() => setEditing(toPackInput(p))} className="press grid h-7 w-7 place-items-center rounded-md border border-[#2a2a2a] bg-[#1a1a1a]"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm(`Remover o pack "${p.name}"?`)) del.mutate(p.id); }} className="press grid h-7 w-7 place-items-center rounded-md border border-[#4a1f1f] bg-[#2a0f0f] text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {!list.data?.length && <p className="col-span-full py-6 text-center text-xs text-[#666]">Nenhum pack cadastrado.</p>}
        </div>
      )}

      {editing && (
        <PackEditor
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function toPackInput(p: AdminPack): AdminPackInput {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    cost_credits: p.cost_credits,
    original_value: Number(p.original_value),
    discount_pct: p.discount_pct,
    is_limited: p.is_limited,
    is_active: p.is_active,
    available_until: p.available_until,
    thumbnail_url: p.thumbnail_url,
    sort_order: p.sort_order ?? 0,
    model_codes: [...p.pack_items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i) => i.model_code),
  };
}

function PackEditor({ value, onChange, onSave, onClose, saving }: {
  value: AdminPackInput;
  onChange: (v: AdminPackInput) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const modelsFn = useServerFn(adminListModelCodes);
  const models = useQuery({ queryKey: ["admin", "model_codes"], queryFn: () => modelsFn() });
  const [filter, setFilter] = useState("");
  const setField = <K extends keyof AdminPackInput>(k: K, v: AdminPackInput[K]) => onChange({ ...value, [k]: v });

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const all = models.data ?? [];
    if (!f) return all;
    return all.filter((m) => m.code.toLowerCase().includes(f) || m.name.toLowerCase().includes(f) || m.category.toLowerCase().includes(f));
  }, [models.data, filter]);

  const toggle = (code: string) => {
    const exists = value.model_codes.includes(code);
    setField("model_codes", exists ? value.model_codes.filter((c) => c !== code) : [...value.model_codes, code]);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="grid max-h-[92vh] w-full max-w-3xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
          <h3 className="text-sm font-bold">{value.id ? "Editar" : "Novo"} pack</h3>
          <button onClick={onClose} className="press grid h-7 w-7 place-items-center rounded-md border border-[#2a2a2a]"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Field label="Nome" className="col-span-2">
              <input value={value.name} onChange={(e) => setField("name", e.target.value)} className="input" />
            </Field>
            <Field label="Descrição" className="col-span-2">
              <textarea value={value.description ?? ""} onChange={(e) => setField("description", e.target.value || null)} className="input min-h-[64px] py-2" />
            </Field>
            <Field label="Categoria">
              <select value={value.category} onChange={(e) => setField("category", e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Ordem">
              <input type="number" value={value.sort_order ?? 0} onChange={(e) => setField("sort_order", Number(e.target.value))} className="input" />
            </Field>
            <Field label="Custo (créditos)">
              <input type="number" value={value.cost_credits} onChange={(e) => setField("cost_credits", Number(e.target.value))} className="input" />
            </Field>
            <Field label="Valor original (cr)">
              <input type="number" value={value.original_value} onChange={(e) => setField("original_value", Number(e.target.value))} className="input" />
            </Field>
            <Field label="Desconto %">
              <input type="number" value={value.discount_pct ?? ""} onChange={(e) => setField("discount_pct", e.target.value === "" ? null : Number(e.target.value))} className="input" />
            </Field>
            <Field label="Disponível até">
              <input type="datetime-local" value={value.available_until?.slice(0, 16) ?? ""} onChange={(e) => setField("available_until", e.target.value ? new Date(e.target.value).toISOString() : null)} className="input" />
            </Field>
            <Field label="Thumbnail URL" className="col-span-2">
              <input value={value.thumbnail_url ?? ""} onChange={(e) => setField("thumbnail_url", e.target.value || null)} className="input" />
            </Field>
            <label className="flex items-center gap-2"><input type="checkbox" checked={value.is_limited} onChange={(e) => setField("is_limited", e.target.checked)} /> Limitado</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={value.is_active} onChange={(e) => setField("is_active", e.target.checked)} /> Ativo</label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#888]">Modelos no pack ({value.model_codes.length})</p>
            </div>
            <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#111] px-2">
              <Search className="h-3.5 w-3.5 text-[#666]" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar modelo..." className="h-9 flex-1 bg-transparent text-xs text-white outline-none" />
            </div>
            <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-[#1f1f1f]">
              {models.isLoading ? (
                <div className="grid h-24 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                <ul className="divide-y divide-[#1a1a1a]">
                  {filtered.map((m) => {
                    const checked = value.model_codes.includes(m.code);
                    return (
                      <li key={m.code}>
                        <button
                          type="button"
                          onClick={() => toggle(m.code)}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-[#111]"
                        >
                          <input type="checkbox" readOnly checked={checked} />
                          {m.thumbnail_url ? (
                            <img src={m.thumbnail_url} alt="" className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded bg-[#1a1a1a]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{m.name}</p>
                            <p className="truncate text-[10px] text-[#666]">{m.code} · {m.category}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  {!filtered.length && <li className="px-3 py-6 text-center text-[10px] text-[#666]">Nenhum modelo encontrado.</li>}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a] px-4 py-3">
          <button
            onClick={onSave}
            disabled={saving || !value.name.trim()}
            className="press inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#68ed00] text-sm font-bold text-black disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar pack
          </button>
        </div>
      </div>
      <style>{`.input { width: 100%; height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid #2a2a2a; background: #111; color: #fff; }`}</style>
    </div>
  );
}

// ===== Bulk unlock cost =====

function BulkPanel() {
  const bulkFn = useServerFn(adminBulkUpdateUnlockCost);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("free");
  const [cost, setCost] = useState<number>(0);
  const m = useMutation({
    mutationFn: () => bulkFn({ data: { category, unlock_cost: cost } }),
    onSuccess: (r: any) => toast.success(`Atualizados ${r.updated} modelo(s).`),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="max-w-md rounded-xl border border-[#1f1f1f] bg-[#0c0c0c] p-4">
      <p className="text-sm font-bold">Atualizar custo de desbloqueio em lote</p>
      <p className="mt-1 text-[11px] text-[#888]">Define um novo custo padrão para todos os modelos de uma categoria.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Field label="Categoria">
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Custo (créditos)">
          <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="input" />
        </Field>
      </div>
      <button
        onClick={() => { if (confirm(`Aplicar custo ${cost} a todos os modelos da categoria "${category}"?`)) m.mutate(); }}
        disabled={m.isPending}
        className="press mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#68ed00] text-sm font-bold text-black disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Aplicar
      </button>
      <style>{`.input { width: 100%; height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid #2a2a2a; background: #111; color: #fff; }`}</style>
    </div>
  );
}