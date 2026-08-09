import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { cariUserGlobal, getOpsiFilterAsetGlobal } from "@/app/super-admin/actions";
import { TabelUserGlobal } from "@/components/super-admin/tabel-user-global";

export default async function UserGlobalPage() {
  await requireSuperAdmin();

  const [awal, opsiFilter] = await Promise.all([
    cariUserGlobal({ page: 1, pageSize: 15 }),
    getOpsiFilterAsetGlobal(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Manajemen User Global
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Semua user dari semua sekolah, lengkap dengan asal sekolah &amp; role-nya.
        </p>
      </div>

      <TabelUserGlobal dataAwal={awal} sekolahList={opsiFilter.tenant} />
    </div>
  );
}
