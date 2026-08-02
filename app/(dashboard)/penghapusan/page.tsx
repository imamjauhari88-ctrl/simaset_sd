import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Trash2 } from "lucide-react";

export default function PenghapusanPage() {
  return (
    <>
      <Topbar title="Penghapusan Aset" />
      <main className="flex-1 p-6">
        <EmptyState
          icon={Trash2}
          title="Belum ada data"
          description="Ajukan penghapusan untuk aset yang hilang atau rusak berat."
          actionLabel="+ Ajukan Penghapusan"
        />
      </main>
    </>
  );
}
