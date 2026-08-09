import { AlertTriangle, Archive } from "lucide-react";
import { formatAngka, formatTanggalSingkat } from "@/lib/format";
import type { LaporanAsetGlobal } from "@/app/super-admin/actions";

export function LaporanAsetGlobalCard({ laporan }: { laporan: LaporanAsetGlobal }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="tag-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-brick" />
          <p className="font-display font-semibold text-ink">
            Kategori Paling Banyak Rusak
          </p>
        </div>
        {laporan.kategoriPalingRusak.length === 0 ? (
          <p className="text-[13px] text-ink-soft">
            Belum ada aset dengan kondisi rusak tercatat.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {laporan.kategoriPalingRusak.map((k) => (
              <li key={k.nama} className="flex items-center gap-3">
                <span className="text-[13px] text-ink flex-1 truncate">{k.nama}</span>
                <span className="text-[12px] font-medium text-brick bg-brick-soft px-2 py-0.5 rounded-full shrink-0">
                  {formatAngka(k.jumlah)} unit
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tag-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Archive size={16} className="text-brass" />
          <p className="font-display font-semibold text-ink">
            Aset Menganggur &gt; 1 Tahun
          </p>
        </div>
        <p className="text-[13px] text-ink-soft mb-4">
          {formatAngka(laporan.totalMenganggur)} aset gak ada perubahan sama
          sekali dalam setahun terakhir, lintas semua sekolah.
        </p>
        {laporan.contohMenganggur.length === 0 ? (
          <p className="text-[13px] text-ink-soft">Gak ada — semua aset masih aktif.</p>
        ) : (
          <ul className="divide-y divide-line -mx-1">
            {laporan.contohMenganggur.map((a) => (
              <li key={a.kode_aset + a.sekolah} className="px-1 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-ink truncate">{a.nama}</p>
                  <p className="text-[11px] text-ink-soft">
                    {a.kode_aset} · {a.sekolah}
                  </p>
                </div>
                <span className="text-[11px] text-ink-soft shrink-0">
                  {formatTanggalSingkat(a.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
