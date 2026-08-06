import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { FormAsetMassal } from "@/components/aset/form-aset-massal";
import { getKategoriList, getRuanganList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function TambahAsetMassalPage() {
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
      <Topbar title="Tambah Aset Massal" />
      <main className="flex-1 p-6 space-y-4">
        <Link
          href="/aset"
          className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Data Aset
        </Link>
        <FormAsetMassal kategoriList={kategoriList} ruanganList={ruanganList} />
      </main>
    </>
  );
}
