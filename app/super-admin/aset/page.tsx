import { requireSuperAdmin } from "@/lib/super-admin-guard";
import {
  cariAsetGlobal,
  getOpsiFilterAsetGlobal,
  getLaporanAsetGlobal,
} from "@/app/super-admin/actions";
import { TabelAsetGlobal } from "@/components/super-admin/tabel-aset-global";
import { LaporanAsetGlobalCard } from "@/components/super-admin/laporan-aset-global";

export default async function AsetGlobalPage() {
  await requireSuperAdmin();

  const [awal, opsiFilter, laporan] = await Promise.all([
    cariAsetGlobal({ page: 1, pageSize: 15 }),
    getOpsiFilterAsetGlobal(),
    getLaporanAsetGlobal(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Manajemen Aset Global
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Mode read-only + filter lintas tenant — cuma buat lihat, gak bisa
          ubah atau hapus aset milik sekolah.
        </p>
      </div>

      <LaporanAsetGlobalCard laporan={laporan} />

      <TabelAsetGlobal dataAwal={awal} opsiFilter={opsiFilter} />
    </div>
  );
}
