import { Topbar } from "@/components/layout/topbar";
import { KategoriManager } from "@/components/kategori/kategori-manager";
import { getKategoriList, getJumlahAsetPerKategori } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function KategoriPage() {
  const [kategoriList, jumlahAset, profil] = await Promise.all([
    getKategoriList(),
    getJumlahAsetPerKategori(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Kategori Barang" />
      <main className="flex-1 p-6">
        <KategoriManager
          initialData={kategoriList}
          jumlahAset={jumlahAset}
          bisaKelola={profil?.role === "admin"}
        />
      </main>
    </>
  );
}
