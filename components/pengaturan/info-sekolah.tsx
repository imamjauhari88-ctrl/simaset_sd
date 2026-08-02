import { School } from "lucide-react";
import type { Sekolah } from "@/types/database";

export function InfoSekolah({ sekolah }: { sekolah: Sekolah }) {
  return (
    <div className="tag-card p-5 max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <School size={18} className="text-pine" />
        <p className="font-display font-semibold text-ink">Info Sekolah</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            Nama Sekolah
          </p>
          <p className="text-[14px] text-ink">{sekolah.nama}</p>
        </div>

        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            NPSN
          </p>
          <p className="text-[14px] text-ink">{sekolah.npsn || "—"}</p>
        </div>

        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            Alamat
          </p>
          <p className="text-[14px] text-ink">{sekolah.alamat || "—"}</p>
        </div>
      </div>
    </div>
  );
}
