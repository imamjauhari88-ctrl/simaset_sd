import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FormAset } from "@/components/aset/form-aset";
import { RiwayatAset } from "@/components/aset/riwayat-aset";
import { createClient } from "@/lib/supabase/server";
import { getKategoriList, getRuanganList, getRiwayatAset } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";

export default async function DetailAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: aset }, kategoriList, ruanganList, profil, riwayat] =
    await Promise.all([
      supabase.from("aset").select("*").eq("id", id).single(),
      getKategoriList(),
      getRuanganList(),
      getProfilSaya(),
      getRiwayatAset(id),
    ]);

  if (!aset) notFound();

  const bisaSimpan =
    profil?.role === "admin" ||
    (profil?.role === "guru" && aset.dibuat_oleh === profil.id);

  return (
    <>
      <Topbar title={`Aset — ${aset.kode_aset}`} />
      <main className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/aset"
            className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Kembali ke Data Aset
          </Link>
          <Link
            href={`/cetak/aset/${aset.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
          >
            <QrCode size={16} />
            Cetak Label QR
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2">
            <FormAset
              kategoriList={kategoriList}
              ruanganList={ruanganList}
              asetAwal={aset}
              bisaSimpan={bisaSimpan}
            />
          </div>
          <div className="xl:col-span-1">
            <RiwayatAset data={riwayat} />
          </div>
        </div>
      </main>
    </>
  );
}
