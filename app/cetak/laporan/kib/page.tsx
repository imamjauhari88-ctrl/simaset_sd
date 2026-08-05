import { getLaporanAsetPerKategori, getKategoriList } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { KondisiBadge } from "@/components/ui/kondisi-badge";
import { formatRupiah } from "@/lib/format";

export default async function CetakKibPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori: kategoriId } = await searchParams;

  const [daftarAset, sekolah, kategoriList] = await Promise.all([
    getLaporanAsetPerKategori(kategoriId),
    getSekolahSaya(),
    getKategoriList(),
  ]);

  const namaKategori = kategoriId
    ? kategoriList.find((k) => k.id === kategoriId)?.nama ?? "—"
    : "Semua Kategori";

  const totalNilai = daftarAset.reduce(
    (jumlah, a) => jumlah + (a.harga_perolehan ?? 0),
    0
  );

  return (
    <div className="max-w-5xl mx-auto">
      <TombolCetak />

      <div className="text-center mb-6">
        <p className="font-display font-semibold text-ink text-lg">
          KARTU INVENTARIS BARANG (KIB)
        </p>
        <p className="text-sm text-ink-soft">{sekolah?.nama ?? ""}</p>
        {sekolah?.alamat && (
          <p className="text-[12px] text-ink-soft">{sekolah.alamat}</p>
        )}
        {sekolah?.npsn && (
          <p className="text-[12px] text-ink-soft">NPSN: {sekolah.npsn}</p>
        )}
        <p className="text-[13px] text-ink mt-2 font-medium">
          Kategori: {namaKategori}
        </p>
      </div>

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm text-center">
          Tidak ada aset untuk kategori ini.
        </p>
      ) : (
        <>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-ink/30 text-left">
                <th className="py-2 pr-2 w-8">No</th>
                <th className="py-2 pr-2">Kode Aset</th>
                <th className="py-2 pr-2">Nama Barang</th>
                <th className="py-2 pr-2">Merk/Tipe</th>
                <th className="py-2 pr-2">Ruangan</th>
                <th className="py-2 pr-2">Tahun</th>
                <th className="py-2 pr-2">Sumber Dana</th>
                <th className="py-2 pr-2 text-right">Harga Perolehan</th>
                <th className="py-2 pr-2">Kondisi</th>
              </tr>
            </thead>
            <tbody>
              {daftarAset.map((a, i) => (
                <tr key={a.id} className="border-b border-line break-inside-avoid">
                  <td className="py-1.5 pr-2 text-ink-soft">{i + 1}</td>
                  <td className="py-1.5 pr-2 font-mono">{a.kode_aset}</td>
                  <td className="py-1.5 pr-2">{a.nama}</td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {a.merk_tipe || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {a.ruangan?.nama || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {a.tahun_perolehan || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft uppercase">
                    {a.sumber_dana || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    {formatRupiah(a.harga_perolehan ?? 0)}
                  </td>
                  <td className="py-1.5 pr-2">
                    <KondisiBadge kondisi={a.kondisi} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/30 font-medium">
                <td colSpan={7} className="py-2 pr-2 text-right">
                  Total Nilai Perolehan
                </td>
                <td className="py-2 pr-2 text-right">
                  {formatRupiah(totalNilai)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>

          <p className="text-[11px] text-ink-soft mt-6 print:mt-10">
            Dicetak: {new Date().toLocaleString("id-ID")}
          </p>
        </>
      )}
    </div>
  );
}
