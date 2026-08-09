import { requireSuperAdmin } from "@/lib/super-admin-guard";
import {
  getLaporanPenggunaanFitur,
  getLaporanAsetRingkas,
  getOpsiFilterAsetGlobal,
} from "@/app/super-admin/actions";
import { AnalitikFilter } from "@/components/super-admin/analitik-filter";

export default async function AnalitikPage() {
  await requireSuperAdmin();

  const [penggunaanFitur, laporanAset, opsiFilter] = await Promise.all([
    getLaporanPenggunaanFitur(),
    getLaporanAsetRingkas(),
    getOpsiFilterAsetGlobal(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Analitik &amp; Laporan
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Value utama super admin — gambaran lintas semua sekolah, atau
          filter per sekolah.
        </p>
      </div>

      <AnalitikFilter
        penggunaanFiturAwal={penggunaanFitur}
        laporanAsetAwal={laporanAset}
        opsiSekolah={opsiFilter.tenant}
      />
    </div>
  );
}
