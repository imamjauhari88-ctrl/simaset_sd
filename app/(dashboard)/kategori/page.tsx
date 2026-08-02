import { Topbar } from "@/components/layout/topbar";
import { KategoriManager } from "@/components/kategori/kategori-manager";
import { getKategoriList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function KategoriPage() {
  const [kategoriList, profil] = await Promise.all([
    getKategoriList(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Kategori Barang" />
      <main className="flex-1 p-6">
        <KategoriManager
          initialData={kategoriList}
          bisaKelola={profil?.role === "admin"}
        />
      </main>
    </>
  );
}
