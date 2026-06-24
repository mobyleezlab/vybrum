import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Plus, Trash2, Upload, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  adminListAvatars,
  adminUpsertAvatar,
  adminDeleteAvatar,
  adminUploadAvatarImage,
  type AdminAvatarRow,
  type AdminAvatarInput,
} from "@/lib/admin.functions";
import { signAvatarUrl } from "@/lib/profile";

export const Route = createFileRoute("/admin/avatares")({
  ssr: false,
  component: AdminAvataresPage,
});

const EMPTY: AdminAvatarInput = {
  id: null,
  name: "",
  image_url: "",
  active: true,
  sort_order: 0,
};

function AdminAvataresPage() {
  const listFn = useServerFn(adminListAvatars);
  const qc = useQueryClient();
  const avatars = useQuery({
    queryKey: ["admin", "avatars"],
    queryFn: async () => {
      const rows = await listFn();
      // Bucket is private — sign each URL for display.
      return Promise.all(
        rows.map(async (r) => ({ ...r, image_url: await signAvatarUrl(r.image_url) })),
      );
    },
  });
  const [editing, setEditing] = useState<AdminAvatarInput | null>(null);

  const upsertFn = useServerFn(adminUpsertAvatar);
  const deleteFn = useServerFn(adminDeleteAvatar);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Avatar removido");
      qc.invalidateQueries({ queryKey: ["admin", "avatars"] });
      qc.invalidateQueries({ queryKey: ["avatars", "active"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (input: AdminAvatarInput) => upsertFn({ data: input }),
    onSuccess: () => {
      toast.success("Avatar salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "avatars"] });
      qc.invalidateQueries({ queryKey: ["avatars", "active"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[#888]">
          {avatars.data?.length ?? 0} avatar(es). Os ativos aparecem na tela "Editar perfil".
        </p>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="press inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#68ed00] px-3 text-xs font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo avatar
        </button>
      </div>

      {avatars.isLoading ? (
        <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-white" />
      ) : !avatars.data?.length ? (
        <div className="mt-10 text-center text-sm text-[#888]">
          Nenhum avatar cadastrado. Clique em "Novo avatar".
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {avatars.data.map((a) => (
            <AvatarCard
              key={a.id}
              avatar={a}
              onEdit={() =>
                setEditing({
                  id: a.id,
                  name: a.name,
                  image_url: a.image_url,
                  active: a.active,
                  sort_order: a.sort_order,
                })
              }
              onDelete={() => {
                if (confirm(`Remover o avatar "${a.name}"?`)) del.mutate(a.id);
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <AvatarEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSave={(v) => save.mutate(v)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function AvatarCard({
  avatar,
  onEdit,
  onDelete,
}: {
  avatar: AdminAvatarRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="aspect-square overflow-hidden bg-[#1a1a1a]">
        <img src={avatar.image_url} alt={avatar.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white">{avatar.name}</div>
            <div className="text-[10px] text-[#666]">
              #{avatar.sort_order} · {avatar.active ? "ativo" : "oculto"}
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={onEdit}
            className="press inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-[#2a2a2a] bg-[#181818] text-[11px] font-semibold text-white"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>
          <button
            onClick={onDelete}
            className="press inline-flex h-7 items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 px-2 text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarEditor({
  value,
  onClose,
  onSave,
  saving,
}: {
  value: AdminAvatarInput;
  onClose: () => void;
  onSave: (v: AdminAvatarInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AdminAvatarInput>(value);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadFn = useServerFn(adminUploadAvatarImage);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem.");
      return;
    }
    if (file.size > 4_000_000) {
      toast.error("Imagem muito grande (máx 4MB).");
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = String(r.result || "");
          const i = s.indexOf(",");
          resolve(i >= 0 ? s.slice(i + 1) : s);
        };
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await uploadFn({
        data: { base64, contentType: file.type, filename: file.name },
      });
      // Persist the stable storage path; preview uses the signed URL.
      setForm((f) => ({ ...f, image_url: res.path }));
      setPreviewUrl(res.url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const canSave = form.name.trim().length > 0 && form.image_url.trim().length > 0;
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Resolve preview for the current form.image_url (path or URL).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useState(() => {
    void (async () => {
      if (!form.image_url) return setPreviewUrl("");
      setPreviewUrl(await signAvatarUrl(form.image_url));
    })();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            {form.id ? "Editar avatar" : "Novo avatar"}
          </h2>
          <button onClick={onClose} className="text-xs text-[#888]">
            Fechar
          </button>
        </div>

        <div className="flex gap-3">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
            {form.image_url ? (
              <img src={form.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-[#666]">sem imagem</span>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#181818] px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Enviando..." : "Enviar imagem"}
            </button>
            <p className="mt-1 text-[10px] text-[#666]">PNG/JPG/WebP até 4MB.</p>
          </div>
        </div>

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#888]">
          Nome
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none"
          placeholder="Ex.: Tigre"
        />

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#888]">
          URL da imagem
        </label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-xs text-white outline-none"
          placeholder="https://..."
        />

        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-xs text-white">
            Ordem:
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) || 0 })
              }
              className="h-8 w-20 rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-2 text-xs text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="press h-10 rounded-lg border border-[#2a2a2a] bg-[#181818] px-4 text-xs font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            disabled={!canSave || saving}
            onClick={() => onSave(form)}
            className="press inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#68ed00] px-4 text-xs font-bold text-black disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
