import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getDaftarSekolahUntukSuperAdmin } from "@/lib/queries/super-admin";
import { TabelSekolah } from "@/components/super-admin/tabel-sekolah";

export default async function DataSekolahPage() {
  await requireSuperAdmin();

  const daftar = await getDaftarSekolahUntukSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Data Sekolah
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Pantau semua sekolah yang terdaftar di platform.
        </p>
      </div>

      <TabelSekolah daftar={daftar} />
    </div>
  );
}
