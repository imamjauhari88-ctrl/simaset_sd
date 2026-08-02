import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FormAset } from "@/components/aset/form-aset";
import { getKategoriList, getRuanganList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function TambahAsetPage() {
  const profil = await getProfilSaya();
  if (profil && profil.role === "kepsek") {
    redirect("/aset");
  }

  const [kategoriList, ruanganList] = await Promise.all([
    getKategoriList(),
    getRuanganList(),
  ]);

  return (
    <>
      <Topbar title="Tambah Aset" />
      <main className="flex-1 p-6">
        <FormAset kategoriList={kategoriList} ruanganList={ruanganList} />
      </main>
    </>
  );
}
