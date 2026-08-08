import { CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalSingkat } from "@/lib/format";
import type { SekolahUntukSuperAdmin } from "@/lib/queries/super-admin";

export function DaftarSekolahAktif({
  daftar,
}: {
  daftar: SekolahUntukSuperAdmin[];
}) {
  if (daftar.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Belum ada sekolah aktif"
        description="Sekolah yang udah kamu setujui bakal muncul di sini."
      />
    );
  }

  return (
    <div className="tag-card overflow-hidden">
      <ul className="divide-y divide-line">
        {daftar.map((s) => (
          <li key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-ink font-medium">{s.nama}</p>
              <p className="text-[12px] text-ink-soft mt-0.5">
                {s.npsn && `NPSN ${s.npsn} · `}
                {s.disetujui_at
                  ? `Aktif sejak ${formatTanggalSingkat(s.disetujui_at)}`
                  : "Aktif"}
              </p>
              {s.admin && (
                <p className="text-[12px] text-ink-soft mt-1">
                  Admin: <span className="text-ink">{s.admin.nama}</span>
                  {s.admin.email && ` (${s.admin.email})`}
                </p>
              )}
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-sage bg-sage-soft px-2.5 py-1 rounded-full w-fit">
              <CheckCircle2 size={12} />
              Aktif
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
