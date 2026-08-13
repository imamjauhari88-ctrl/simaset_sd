import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSekolahSaya } from "@/lib/tenant/context";
import { LabelAsetCard } from "@/components/aset/label-aset-card";
import { TombolCetak } from "@/app/cetak/tombol-cetak";

export default async function CetakLabelAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: aset }, sekolah] = await Promise.all([
    supabase
      .from("aset")
      .select("kode_aset, kode_barang_dinas, nomor_register, nama")
      .eq("id", id)
      .single(),
    getSekolahSaya(),
  ]);

  if (!aset) notFound();

  return (
    <div className="max-w-sm mx-auto">
      <TombolCetak />
      <LabelAsetCard
        kodeAset={aset.kode_aset}
        kodeBarang={aset.kode_barang_dinas}
        register={aset.nomor_register}
        namaAset={aset.nama}
        namaSekolah={sekolah?.nama ?? ""}
      />
      <p className="print:hidden text-[12px] text-ink-soft mt-4">
        Tempel label ini di badan aset. Kode di dalam QR bisa dipakai saat
        Opname Fisik.
      </p>
    </div>
  );
}
