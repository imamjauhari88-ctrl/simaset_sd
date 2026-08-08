"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { XCircle, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalSingkat } from "@/lib/format";
import { kembalikanKeAntrean } from "@/app/super-admin/actions";
import type { SekolahUntukSuperAdmin } from "@/lib/queries/super-admin";

export function DaftarSekolahDitolak({
  daftar,
}: {
  daftar: SekolahUntukSuperAdmin[];
}) {
  const [pending, startTransition] = useTransition();

  function kembalikan(s: SekolahUntukSuperAdmin) {
    startTransition(async () => {
      try {
        await kembalikanKeAntrean(s.id);
        toast.success(`${s.nama} dikembalikan ke antrean menunggu`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mengembalikan sekolah");
      }
    });
  }

  if (daftar.length === 0) {
    return (
      <EmptyState
        icon={XCircle}
        title="Gak ada yang ditolak"
        description="Sekolah yang pendaftarannya kamu tolak bakal muncul di sini."
      />
    );
  }

  return (
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
              {s.ditolak_alasan && (
                <p className="text-[12px] text-brick mt-1.5 bg-brick-soft rounded-md px-2.5 py-1.5 inline-block">
                  Alasan: {s.ditolak_alasan}
                </p>
              )}
            </div>
            <button
              onClick={() => kembalikan(s)}
              disabled={pending}
              className="shrink-0 inline-flex items-center gap-1.5 text-ink-soft text-[13px] font-medium px-3.5 py-2 rounded-lg border border-line hover:bg-paper transition-colors disabled:opacity-60 w-fit"
            >
              <RotateCcw size={14} />
              Kembalikan ke Antrean
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
