import { Topbar } from "@/components/layout/topbar";
import { RuanganManager } from "@/components/ruangan/ruangan-manager";
import { getRuanganList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function RuanganPage() {
  const [ruanganList, profil] = await Promise.all([
    getRuanganList(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Ruangan / Lokasi" />
      <main className="flex-1 p-6">
        <RuanganManager
          initialData={ruanganList}
          bisaKelola={profil?.role === "admin"}
        />
      </main>
    </>
  );
}
