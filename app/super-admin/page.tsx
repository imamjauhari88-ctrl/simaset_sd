import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getDaftarSekolahUntukSuperAdmin } from "@/lib/queries/super-admin";
import { DaftarSekolahPending } from "@/components/super-admin/daftar-sekolah-pending";

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

      <div className="grid grid-cols-3 gap-3 max-w-md">
        <div className="tag-card p-4 text-center">
          <p className="font-display text-xl font-semibold text-brass">
            {pending.length}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">Menunggu</p>
        </div>
        <div className="tag-card p-4 text-center">
          <p className="font-display text-xl font-semibold text-sage">
            {aktif.length}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">Aktif</p>
        </div>
        <div className="tag-card p-4 text-center">
          <p className="font-display text-xl font-semibold text-brick">
            {ditolak.length}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">Ditolak</p>
        </div>
      </div>

      <DaftarSekolahPending daftar={pending} />
    </div>
  );
}
