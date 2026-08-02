import { getDaftarAset } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { LabelAsetCard } from "@/components/aset/label-aset-card";
import { TombolCetak } from "@/app/cetak/tombol-cetak";

export default async function CetakSemuaLabelPage() {
  const [daftarAset, sekolah] = await Promise.all([
    getDaftarAset(),
    getSekolahSaya(),
  ]);

  return (
    <div>
      <TombolCetak />

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm">Belum ada aset untuk dicetak.</p>
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
