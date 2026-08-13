import { getLaporanAsetPerKategori, getKategoriList } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { formatAngka, labelAsalUsul } from "@/lib/format";

/** Sel kolom "NOMOR" (Pabrik/Rangka/Mesin/Polisi/BPKB) belum ada field-
 * nya di data aset (isian khusus kendaraan bermotor, jarang dipakai
 * sekolah) — sengaja ditampilkan kosong dulu di kolom cetak, bukan
 * dihapus, biar formatnya tetap 16 kolom persis format dinas dan bisa
 * ditulis manual di kertas kalau memang ada. Sama buat Nomor
 * Registrasi/Ukuran/Bahan.
 */
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

  return (
    <div className="cetak-landscape max-w-[1400px] mx-auto">
      <TombolCetak />

      <div className="text-center mb-1">
        <p className="font-display font-bold text-ink text-base uppercase">
          Kartu Inventaris Barang (KIB) B
        </p>
        <p className="font-display font-bold text-ink text-base uppercase">
          Peralatan dan Mesin
        </p>
      </div>

      <div className="text-center text-[12px] text-ink-soft mb-3">
        <p>{sekolah?.nama ?? ""}</p>
        {sekolah?.alamat && <p>{sekolah.alamat}</p>}
        {kategoriId && (
          <p className="text-ink font-medium mt-1">Kategori: {namaKategori}</p>
        )}
      </div>

      <p className="text-[12px] text-ink font-medium mb-3">
        NO. KODE LOKASI :{" "}
        <span className="font-mono">{sekolah?.kode_lokasi || "—"}</span>
      </p>

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm text-center">
          Tidak ada aset untuk kategori ini.
        </p>
      ) : (
        <>
          <table className="w-full text-[10px] border-collapse border border-ink/40">
            <thead>
              <tr className="text-center font-semibold">
                <th rowSpan={2} className="border border-ink/40 px-1 py-1 w-7">NO</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">KODE BARANG</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">NAMA BARANG/ JENIS BARANG</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">NOMOR REGISTRASI</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">MERK/ TYPE</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">UKURAN/ CC</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">BAHAN</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">TAHUN PEMBELIAN</th>
                <th colSpan={5} className="border border-ink/40 px-1 py-1">NOMOR</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">ASAL USUL CARA PEROLEHAN</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">HARGA</th>
                <th rowSpan={2} className="border border-ink/40 px-1 py-1">KET.</th>
              </tr>
              <tr className="text-center font-semibold">
                <th className="border border-ink/40 px-1 py-1">PABRIK</th>
                <th className="border border-ink/40 px-1 py-1">RANGKA</th>
                <th className="border border-ink/40 px-1 py-1">MESIN</th>
                <th className="border border-ink/40 px-1 py-1">POLISI</th>
                <th className="border border-ink/40 px-1 py-1">BPKB</th>
              </tr>
              <tr className="text-center text-ink-soft">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                  <th key={n} className="border border-ink/40 px-1 py-0.5 font-normal">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daftarAset.map((a, i) => (
                <tr key={a.id} className="break-inside-avoid">
                  <td className="border border-ink/40 px-1 py-1 text-center">{i + 1}</td>
                  <td className="border border-ink/40 px-1 py-1 font-mono">
                    {a.kode_barang_dinas || a.kode_aset}
                  </td>
                  <td className="border border-ink/40 px-1 py-1">{a.nama}</td>
                  <td className="border border-ink/40 px-1 py-1 font-mono">{a.nomor_register || ""}</td>
                  <td className="border border-ink/40 px-1 py-1">{a.merk_tipe || ""}</td>
                  <td className="border border-ink/40 px-1 py-1">{a.ukuran_konstruksi || ""}</td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.tahun_perolehan || ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1">
                    {labelAsalUsul(a.sumber_dana)}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-right">
                    {a.harga_perolehan ? formatAngka(a.harga_perolehan) : ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1">{a.catatan || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[11px] text-ink-soft mt-6 print:mt-10">
            Dicetak: {new Date().toLocaleString("id-ID")}
          </p>

          <TandaTangan sekolah={sekolah} />
        </>
      )}
    </div>
  );
}
