import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getDaftarSekolahUntukSuperAdmin } from "@/lib/queries/super-admin";
import { SuperAdminTabs } from "@/components/super-admin/super-admin-tabs";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [pending, aktif, ditolak] = await Promise.all([
    getDaftarSekolahUntukSuperAdmin("menunggu_approval"),
    getDaftarSekolahUntukSuperAdmin("aktif"),
    getDaftarSekolahUntukSuperAdmin("ditolak"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Persetujuan Pendaftaran Sekolah
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Sekolah baru gak bisa masuk dashboard sampai kamu setujui di sini.
        </p>
      </div>

      <SuperAdminTabs pending={pending} aktif={aktif} ditolak={ditolak} />
    </div>
  );
}
