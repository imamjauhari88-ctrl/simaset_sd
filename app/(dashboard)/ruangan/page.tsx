import { Topbar } from "@/components/layout/topbar";
import { RuanganManager } from "@/components/ruangan/ruangan-manager";
import { getRuanganList, getJumlahAsetPerRuangan } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function RuanganPage() {
  const [ruanganList, jumlahAset, profil] = await Promise.all([
    getRuanganList(),
    getJumlahAsetPerRuangan(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Ruangan / Lokasi" />
      <main className="flex-1 p-6">
        <RuanganManager
          initialData={ruanganList}
          jumlahAset={jumlahAset}
          bisaKelola={profil?.role === "admin"}
        />
      </main>
    </>
  );
}
