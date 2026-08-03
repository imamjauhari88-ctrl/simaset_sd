import { Topbar } from "@/components/layout/topbar";
import { PeminjamanManager } from "@/components/peminjaman/peminjaman-manager";
import { getDaftarAset, getDaftarPeminjamanPaginated } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";
import type { StatusPeminjaman } from "@/types/database";

const PAGE_SIZE = 15;

export default async function PeminjamanPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    terlambat?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.q ?? "";
  const status = (sp.status as StatusPeminjaman | undefined) ?? "semua";
  const hanyaTerlambat = sp.terlambat === "1";

  const [peminjamanHalamanIni, asetList, profil] = await Promise.all([
    getDaftarPeminjamanPaginated({
      page,
      pageSize: PAGE_SIZE,
      search,
      status,
      hanyaTerlambat,
    }),
    getDaftarAset(),
    getProfilSaya(),
  ]);

  return (
    <>
      <Topbar title="Peminjaman Aset" />
      <main className="flex-1 p-6">
        <PeminjamanManager
          initialData={peminjamanHalamanIni}
          asetList={asetList}
          role={profil?.role}
          userId={profil?.id}
        />
      </main>
    </>
  );
}
