import { Topbar } from "@/components/layout/topbar";
import { AsetTetapManager } from "@/components/aset-tetap/aset-tetap-manager";
import { getAsetTetapList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function AsetTetapPage() {
  const [daftar, profil] = await Promise.all([
    getAsetTetapList(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Aset Tetap Khusus" />
      <main className="flex-1 p-6">
        <p className="text-[13px] text-ink-soft mb-4">
          Tanah, Gedung &amp; Bangunan, Jalan/Irigasi/Jaringan, Aset Tetap
          Lainnya, dan Konstruksi Dalam Pengerjaan — dicatat terpisah dari
          Data Aset harian karena jarang berubah. Datanya dipakai untuk
          laporan KIB A/C/D/E/F format dinas.
        </p>
        <AsetTetapManager
          initialData={daftar}
          bisaKelola={profil?.role === "admin" || profil?.role === "guru"}
          bisaHapus={profil?.role === "admin"}
        />
      </main>
    </>
  );
}
