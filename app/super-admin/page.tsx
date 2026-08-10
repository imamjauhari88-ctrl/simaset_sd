import { School, Boxes, Users, Activity } from "lucide-react";
import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getRingkasanDashboardSuperAdmin } from "@/lib/supabase/super-admin-queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { GrafikSekolahAktif } from "@/components/super-admin/grafik-sekolah-aktif";
import { formatAngka } from "@/lib/format";

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();

  const ringkasan = await getRingkasanDashboardSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Dashboard
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Semua angka penting lintas sekolah, satu layar — gak perlu bolak-balik.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Sekolah Terdaftar"
          value={formatAngka(ringkasan.totalSekolah)}
          hint={`${formatAngka(ringkasan.sekolahAktifHariIni)} sekolah aktif hari ini`}
          icon={School}
          tone="pine"
          href="/super-admin/sekolah"
        />
        <StatCard
          label="Total Aset Keseluruhan"
          value={formatAngka(ringkasan.totalAset)}
          hint="Dari semua sekolah"
          icon={Boxes}
          tone="brass"
        />
        <StatCard
          label="Total User"
          value={formatAngka(ringkasan.totalUser)}
          hint="Guru/TU yang terdaftar"
          icon={Users}
          tone="sage"
        />
      </div>

      <div className="tag-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} className="text-ink-soft" />
          <p className="font-display font-semibold text-ink">
            Sekolah Paling Aktif Upload Aset
          </p>
        </div>
        <p className="text-[13px] text-ink-soft mb-4">Bulan ini</p>
        <GrafikSekolahAktif data={ringkasan.sekolahPalingAktif} />
      </div>
    </div>
  );
}
