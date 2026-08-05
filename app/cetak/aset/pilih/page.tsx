import { getAsetByIds } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { LabelAsetCard } from "@/components/aset/label-aset-card";
import { TombolCetak } from "@/app/cetak/tombol-cetak";

export default async function CetakLabelTerpilihPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsStr } = await searchParams;
  const ids = idsStr ? idsStr.split(",").filter(Boolean) : [];

  const [daftarAset, sekolah] = await Promise.all([
    getAsetByIds(ids),
    getSekolahSaya(),
  ]);

  return (
    <div>
      <TombolCetak />

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm">Tidak ada aset yang dipilih.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
          {daftarAset.map((a) => (
            <LabelAsetCard
              key={a.id}
              kodeAset={a.kode_aset}
              namaAset={a.nama}
              namaSekolah={sekolah?.nama ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
