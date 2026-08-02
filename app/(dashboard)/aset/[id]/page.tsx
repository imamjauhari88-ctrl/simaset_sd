import Link from "next/link";
import { QrCode } from "lucide-react";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FormAset } from "@/components/aset/form-aset";
import { createClient } from "@/lib/supabase/server";
import { getKategoriList, getRuanganList } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function DetailAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: aset }, kategoriList, ruanganList, profil] =
    await Promise.all([
      supabase.from("aset").select("*").eq("id", id).single(),
      getKategoriList(),
      getRuanganList(),
      getProfilSaya(),
    ]);

  if (!aset) notFound();

  const bisaSimpan =
    profil?.role === "admin" ||
    (profil?.role === "guru" && aset.dibuat_oleh === profil.id);

  return (
    <>
      <Topbar title={`Aset — ${aset.kode_aset}`} />
      <main className="flex-1 p-6 space-y-4">
        <Link
          href={`/cetak/aset/${aset.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
        >
          <QrCode size={16} />
          Cetak Label QR
        </Link>
        <FormAset
          kategoriList={kategoriList}
          ruanganList={ruanganList}
          asetAwal={aset}
          bisaSimpan={bisaSimpan}
        />
      </main>
    </>
  );
}
