import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { FileBarChart } from "lucide-react";

export default function LaporanPage() {
  return (
    <>
      <Topbar title="Laporan" />
      <main className="flex-1 p-6">
        <EmptyState
          icon={FileBarChart}
          title="Belum ada data"
          description="Pilih jenis laporan (KIB, KIR, Mutasi) untuk diunduh sebagai PDF/Excel."
        />
      </main>
    </>
  );
}
