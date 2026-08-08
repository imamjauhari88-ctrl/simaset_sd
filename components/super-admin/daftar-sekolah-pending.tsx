"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalSingkat } from "@/lib/format";
import { setujuiSekolah, tolakSekolah } from "@/app/super-admin/actions";
import type { SekolahUntukSuperAdmin } from "@/lib/queries/super-admin";

export function DaftarSekolahPending({
  daftar,
}: {
  daftar: SekolahUntukSuperAdmin[];
}) {
  const [pending, startTransition] = useTransition();
  const [tolakTarget, setTolakTarget] = useState<SekolahUntukSuperAdmin | null>(
    null
  );
  const [alasan, setAlasan] = useState("");

  function setujui(s: SekolahUntukSuperAdmin) {
    startTransition(async () => {
      try {
        await setujuiSekolah(s.id);
        toast.success(`${s.nama} disetujui — admin sekolah sekarang bisa masuk`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyetujui sekolah");
      }
    });
  }

  function konfirmasiTolak() {
    if (!tolakTarget) return;
    startTransition(async () => {
      try {
        await tolakSekolah(tolakTarget.id, alasan);
        toast.success(`Pendaftaran ${tolakTarget.nama} ditolak`);
        setTolakTarget(null);
        setAlasan("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menolak sekolah");
      }
    });
  }

  if (daftar.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Gak ada yang menunggu"
        description="Semua pendaftaran sekolah udah diproses. Pendaftaran baru bakal muncul di sini."
      />
    );
  }

  return (
    <>
      <div className="tag-card overflow-hidden">
        <ul className="divide-y divide-line">
          {daftar.map((s) => (
            <li key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-ink font-medium">{s.nama}</p>
                <p className="text-[12px] text-ink-soft mt-0.5">
                  {s.npsn && `NPSN ${s.npsn} · `}
                  Daftar {formatTanggalSingkat(s.created_at)}
                </p>
                {s.admin && (
                  <p className="text-[12px] text-ink-soft mt-1">
                    Admin: <span className="text-ink">{s.admin.nama}</span>
                    {s.admin.email && ` (${s.admin.email})`}
                  </p>
                )}
                {s.alamat && (
                  <p className="text-[12px] text-ink-soft mt-0.5">{s.alamat}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setujui(s)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 bg-pine text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 size={15} />
                  Setujui
                </button>
                <button
                  onClick={() => setTolakTarget(s)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 text-brick text-[13px] font-medium px-3.5 py-2 rounded-lg border border-line hover:bg-brick-soft transition-colors disabled:opacity-60"
                >
                  <XCircle size={15} />
                  Tolak
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {tolakTarget && (
        <Modal
          title={`Tolak pendaftaran ${tolakTarget.nama}?`}
          onClose={() => {
            setTolakTarget(null);
            setAlasan("");
          }}
        >
          <p className="text-[13px] text-ink-soft mb-3">
            Kasih alasan singkat — bakal ditunjukkan ke admin sekolah ini.
          </p>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="mis. Data NPSN gak valid, coba daftar ulang dengan data yang benar."
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={konfirmasiTolak}
              disabled={pending || !alasan.trim()}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? "Memproses..." : "Ya, Tolak Pendaftaran"}
            </button>
            <button
              onClick={() => {
                setTolakTarget(null);
                setAlasan("");
              }}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
