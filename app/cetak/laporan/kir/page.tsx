import { getLaporanAsetPerRuangan, getRuanganList } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { formatAngka } from "@/lib/format";

/** Kolom Merk/Model, No. Seri Pabrik, Ukuran, Bahan belum ada field-nya
 * di data aset (sama kayak KIB B) — sengaja dikosongkan dulu, bukan
 * dihapus kolomnya, biar formatnya tetap 14 kolom persis format dinas.
 * "Keadaan Barang" dipecah 3 kolom (B/KB/RB): kondisi aset "rusak_ringan"
 * dipetakan ke kolom KB (Kurang Baik), sesuai istilah form dinas. */
export default async function CetakKirPage({
  searchParams,
}: {
  searchParams: Promise<{ ruangan?: string }>;
}) {
  const { ruangan: ruanganId } = await searchParams;

  const [daftarAset, sekolah, ruanganList] = await Promise.all([
    getLaporanAsetPerRuangan(ruanganId),
    getSekolahSaya(),
    getRuanganList(),
  ]);

  const namaRuangan = ruanganId
    ? ruanganList.find((r) => r.id === ruanganId)?.nama ?? "—"
    : "Semua Ruangan";

  return (
    <div className="cetak-landscape max-w-[1400px] mx-auto">
      <TombolCetak />

      <div className="text-center mb-3">
        <p className="font-display font-bold text-ink text-base uppercase">
          Kartu Inventaris Ruangan (KIR)
        </p>
      </div>

      <div className="text-[12px] mb-3 grid grid-cols-[auto_1fr] gap-x-2 w-fit">
        <span>PROVINSI</span>
        <span>: {sekolah?.provinsi || "—"}</span>
        <span>KAB/KOTA</span>
        <span>: {sekolah?.kabupaten_kota || "—"}</span>
        <span>UNIT</span>
        <span>: DINAS PENDIDIKAN</span>
        <span>SATUAN KERJA</span>
        <span>: {sekolah?.nama ?? "—"}</span>
        <span>RUANGAN</span>
        <span>: {namaRuangan}</span>
      </div>

      <p className="text-[12px] text-ink font-medium mb-3">
        NO. KODE LOKASI :{" "}
        <span className="font-mono">{sekolah?.kode_lokasi || "—"}</span>
      </p>

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm text-center">
          Tidak ada aset di ruangan ini.
        </p>
      ) : (
        <>
          <table className="w-full text-[10px] border-collapse border border-ink/40">
            <thead>
              <tr className="text-center font-semibold">
                <th rowSpan={3} className="border border-ink/40 px-1 py-1 w-7">NO</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">KODE BARANG</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">NAMA BARANG/ JENIS BARANG</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">MERK/ MODEL</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">NO. SERI PABRIK</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">UKURAN</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">BAHAN</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">TAHUN PEMBUATAN/ PEMBELIAN</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">JUMLAH BARANG/ REGISTER</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">HARGA BELI/ PEROLEHAN</th>
                <th colSpan={3} className="border border-ink/40 px-1 py-1">KEADAAN BARANG</th>
                <th rowSpan={3} className="border border-ink/40 px-1 py-1">KETERANGAN MUTASI</th>
              </tr>
              <tr className="text-center font-semibold">
                <th className="border border-ink/40 px-1 py-1">BAIK (B)</th>
                <th className="border border-ink/40 px-1 py-1">KURANG BAIK (KB)</th>
                <th className="border border-ink/40 px-1 py-1">RUSAK BERAT (RB)</th>
              </tr>
              <tr className="text-center text-ink-soft">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
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
                  <td className="border border-ink/40 px-1 py-1 font-mono">{a.kode_aset}</td>
                  <td className="border border-ink/40 px-1 py-1">{a.nama}</td>
                  <td className="border border-ink/40 px-1 py-1">{a.merk_tipe || ""}</td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.tahun_perolehan || ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-center">{a.stok}</td>
                  <td className="border border-ink/40 px-1 py-1 text-right">
                    {a.harga_perolehan ? formatAngka(a.harga_perolehan) : ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.kondisi === "baik" ? a.stok : ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.kondisi === "rusak_ringan" ? a.stok : ""}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.kondisi === "rusak_berat" ? a.stok : ""}
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
