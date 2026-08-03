import { Topbar } from "@/components/layout/topbar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { KondisiChart } from "@/components/dashboard/kondisi-chart";
import { TrenChart } from "@/components/dashboard/tren-chart";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { getDashboardData } from "@/lib/supabase/queries";
import { formatRupiah } from "@/lib/format";
import { Boxes, Wallet, TriangleAlert, DoorOpen } from "lucide-react";

const formatAngka = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <Topbar title="Dashboard" />

      <main className="flex-1 p-6 space-y-6">
        <WelcomeBanner />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Aset"
            value={formatAngka(data.totalAset)}
            hint={`Tercatat di ${formatAngka(data.totalRuangan)} ruangan`}
            icon={Boxes}
            tone="pine"
          />
          <StatCard
            label="Nilai Total Aset"
            value={formatRupiah(data.nilaiTotalAset)}
            hint="Akumulasi harga perolehan"
            icon={Wallet}
            tone="brass"
          />
          <StatCard
            label="Perlu Perhatian"
            value={formatAngka(data.rusakBerat)}
            hint="Kondisi rusak berat"
            icon={TriangleAlert}
            tone="brick"
          />
          <StatCard
            label="Ruangan Terpantau"
            value={formatAngka(data.totalRuangan)}
            hint="Ruangan/lokasi aktif tercatat"
            icon={DoorOpen}
            tone="sage"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <KondisiChart data={data.kondisiBreakdown} />
          </div>
          <div className="xl:col-span-2">
            <TrenChart data={data.trenBulanan} />
          </div>
        </div>

        <ActivityLog data={data.aktivitas} />
      </main>
    </>
  );
}
