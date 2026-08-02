import { Topbar } from "@/components/layout/topbar";
import { MutasiManager } from "@/components/mutasi/mutasi-manager";
import {
  getDaftarAset,
  getDaftarMutasiPaginated,
  getRuanganList,
} from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

const PAGE_SIZE = 15;

export default async function MutasiPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tahun?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.q ?? "";
  const tahun = sp.tahun && sp.tahun !== "semua" ? Number(sp.tahun) : "semua";

  const [mutasiHalamanIni, asetList, ruanganList, profil] = await Promise.all([
    getDaftarMutasiPaginated({ page, pageSize: PAGE_SIZE, search, tahun }),
    getDaftarAset(),
    getRuanganList(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Mutasi Aset" />
      <main className="flex-1 p-6">
        <MutasiManager
          initialData={mutasiHalamanIni}
          asetList={asetList}
          ruanganList={ruanganList}
          role={profil?.role}
        />
      </main>
    </>
  );
}
