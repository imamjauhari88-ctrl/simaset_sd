import { Topbar } from "@/components/layout/topbar";
import { NotFoundState } from "@/components/ui/not-found-state";

export default function DashboardNotFound() {
  return (
    <>
      <Topbar title="Tidak Ditemukan" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <NotFoundState
            title="Halaman atau data tidak ditemukan"
            description="Aset, ruangan, atau halaman yang kamu cari mungkin sudah dihapus atau URL-nya salah."
          />
        </div>
      </main>
    </>
  );
}
