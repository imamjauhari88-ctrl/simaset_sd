import { Topbar } from "@/components/layout/topbar";
import { PemeliharaanManager } from "@/components/pemeliharaan/pemeliharaan-manager";
import { getDaftarAset, getDaftarPemeliharaanPaginated } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

const PAGE_SIZE = 15;

export default async function PemeliharaanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tahun?: string; jenis?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.q ?? "";
  const tahun = sp.tahun && sp.tahun !== "semua" ? Number(sp.tahun) : "semua";
  const jenis = (sp.jenis ?? "semua") as "rutin" | "perbaikan" | "semua";

  const [pemeliharaanHalamanIni, asetList, profil] = await Promise.all([
    getDaftarPemeliharaanPaginated({ page, pageSize: PAGE_SIZE, search, tahun, jenis }),
    getDaftarAset(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Pemeliharaan" />
      <main className="flex-1 p-6">
        <PemeliharaanManager
          initialData={pemeliharaanHalamanIni}
          asetList={asetList}
          role={profil?.role}
        />
      </main>
    </>
  );
}
