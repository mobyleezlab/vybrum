import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, History, Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import {
  adminListSettings,
  adminUpsertSetting,
  adminListAuditLog,
  type AppSetting,
  type AuditEntry,
} from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/config")({
  ssr: false,
  component: Page,
});

type Tab = "settings" | "audit";

function Page() {
  const [tab, setTab] = useState<Tab>("settings");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<SettingsIcon className="h-4 w-4" />}>
          Configurações globais
        </TabButton>
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={<History className="h-4 w-4" />}>
          Audit log
        </TabButton>
      </div>
      {tab === "settings" ? <SettingsPanel /> : <AuditPanel />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="press inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
      style={{
        borderColor: active ? "#68ed00" : "#2a2a2a",
        background: active ? "#68ed0022" : "#0f0f0f",
        color: active ? "#68ed00" : "#ddd",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

type FieldType = "boolean" | "number" | "string" | "json";

function inferType(value: any): FieldType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  return "json";
}

function SettingsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListSettings);
  const upsertFn = useServerFn(adminUpsertSetting);

  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => listFn(),
  });

  return (
    <div className="space-y-3">
      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div>
      ) : q.isError ? (
        <ErrorBox message={(q.error as any)?.message ?? "Erro ao carregar."} />
      ) : (q.data?.settings.length ?? 0) === 0 ? (
        <EmptyBox text="Nenhuma configuração definida ainda." />
      ) : (
        q.data!.settings.map((s) => (
          <SettingRow
            key={s.key}
            setting={s}
            onSave={async (value) => {
              await upsertFn({ data: { key: s.key, value } });
              toast.success(`"${s.key}" atualizado.`);
              qc.invalidateQueries({ queryKey: ["admin", "settings"] });
            }}
          />
        ))
      )}
    </div>
  );
}

function SettingRow({ setting, onSave }: { setting: AppSetting; onSave: (value: any) => Promise<void> }) {
  const type = useMemo(() => inferType(setting.value), [setting.value]);
  const [draft, setDraft] = useState<string>(() => stringifyValue(setting.value, type));
  const [boolDraft, setBoolDraft] = useState<boolean>(() => !!setting.value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(stringifyValue(setting.value, type));
    setBoolDraft(!!setting.value);
  }, [setting.value, type]);

  const dirty =
    type === "boolean" ? boolDraft !== !!setting.value : draft !== stringifyValue(setting.value, type);

  const handleSave = async () => {
    try {
      setSaving(true);
      let parsed: any;
      if (type === "boolean") parsed = boolDraft;
      else if (type === "number") {
        const n = Number(draft);
        if (!Number.isFinite(n)) throw new Error("Valor numérico inválido.");
        parsed = n;
      } else if (type === "string") parsed = draft;
      else {
        try { parsed = JSON.parse(draft); } catch { throw new Error("JSON inválido."); }
      }
      await onSave(parsed);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-[#0f0f0f] px-2 py-0.5 text-xs text-[#68ed00]">{setting.key}</code>
            <span className="text-[10px] uppercase tracking-wide text-[#666]">{type}</span>
          </div>
          {setting.description && <p className="mt-1 text-xs text-[#888]">{setting.description}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="press inline-flex h-9 items-center gap-1 rounded-lg bg-[#68ed00] px-3 text-xs font-bold text-black disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Salvar
        </button>
      </div>

      <div className="mt-3">
        {type === "boolean" ? (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={boolDraft}
              onChange={(e) => setBoolDraft(e.target.checked)}
              className="h-4 w-4 accent-[#68ed00]"
            />
            {boolDraft ? "Ativado" : "Desativado"}
          </label>
        ) : type === "json" ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-2 font-mono text-xs text-white outline-none focus:border-[#68ed00]"
          />
        ) : (
          <input
            type={type === "number" ? "number" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none focus:border-[#68ed00]"
          />
        )}
      </div>

      <p className="mt-2 text-[10px] text-[#555]">
        Última edição: {new Date(setting.updated_at).toLocaleString("pt-BR")}
        {setting.updated_by_email ? ` · ${setting.updated_by_email}` : ""}
      </p>
    </div>
  );
}

function stringifyValue(value: any, type: FieldType) {
  if (type === "string") return value == null ? "" : String(value);
  if (type === "number") return value == null ? "0" : String(value);
  if (type === "boolean") return value ? "true" : "false";
  try { return JSON.stringify(value, null, 2); } catch { return String(value ?? ""); }
}

function AuditPanel() {
  const listFn = useServerFn(adminListAuditLog);
  const [action, setAction] = useState("");

  const q = useQuery({
    queryKey: ["admin", "audit", action],
    queryFn: () => listFn({ data: { action: action || null, limit: 200 } }),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-10 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none focus:border-[#68ed00]"
        >
          <option value="">Todas as ações</option>
          {(q.data?.actions ?? []).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="text-xs text-[#888]">{q.data?.entries.length ?? 0} entradas</div>
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div>
      ) : q.isError ? (
        <ErrorBox message={(q.error as any)?.message ?? "Erro ao carregar."} />
      ) : (q.data?.entries.length ?? 0) === 0 ? (
        <EmptyBox text="Sem registros para o filtro atual." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1f1f1f]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f0f0f] text-[#888]">
              <tr>
                <th className="px-3 py-2 font-semibold">Quando</th>
                <th className="px-3 py-2 font-semibold">Ação</th>
                <th className="px-3 py-2 font-semibold">Admin</th>
                <th className="px-3 py-2 font-semibold">Alvo</th>
                <th className="px-3 py-2 font-semibold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
              {q.data!.entries.map((e: AuditEntry) => (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-[#bbb]">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 font-semibold text-white">{e.action}</td>
                  <td className="px-3 py-2 text-[#bbb]">{e.admin_email ?? e.admin_id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-[#bbb]">{e.target_user_email ?? (e.target_user_id ? e.target_user_id.slice(0, 8) : "—")}</td>
                  <td className="px-3 py-2 text-[#888]">
                    <pre className="max-w-[420px] overflow-hidden whitespace-pre-wrap break-words text-[10px] text-[#888]">
                      {e.payload ? JSON.stringify(e.payload, null, 0) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{message}</div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] py-16 text-center">
      <p className="text-sm text-[#888]">{text}</p>
    </div>
  );
}
