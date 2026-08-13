import { getAsetRusakBerat } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { formatAngka } from "@/lib/format";

/** Sumber datanya aset kondisi Rusak Berat (kandidat usulan penghapusan)
 * — bukan berarti aset ini beneran dihapus, modul Penghapusan sengaja
 * dinonaktifkan (wewenang dinas). Kalau sekolah menandai NIHIL di
 * Pengaturan, laporan dipaksa tampil kosong terlepas dari data aset. */
export default async function CetakDaftarUsulanPage() {
  const [daftarAset, sekolah] = await Promise.all([
    getAsetRusakBerat(),
    getSekolahSaya(),
  ]);

  const dipaksaNihil = sekolah?.usulan_penghapusan_nihil ?? false;
  const tampilNihil = dipaksaNihil || daftarAset.length === 0;

  return (
    <div className="max-w-5xl mx-auto">
      <TombolCetak />

      <div className="text-center mb-6">
        <p className="font-display font-bold text-ink text-base uppercase">
          Daftar Usulan Barang yang Dihapus
        </p>
      </div>

      <div className="text-[12px] mb-6 grid grid-cols-[auto_1fr] gap-x-2 w-fit">
        <span>SKPD</span>
        <span>: {sekolah?.nama ?? "—"}</span>
        <span>KAB/KOTA</span>
        <span>: {sekolah?.kabupaten_kota || "—"}</span>
        <span>PROVINSI</span>
        <span>: {sekolah?.provinsi || "—"}</span>
      </div>

      <table className="w-full text-[11px] border-collapse border border-ink/40">
        <thead>
          <tr className="text-center font-semibold">
            <th className="border border-ink/40 px-1.5 py-1.5 w-8">NO</th>
            <th className="border border-ink/40 px-1.5 py-1.5">NAMA BARANG</th>
            <th className="border border-ink/40 px-1.5 py-1.5">NO. KODE BARANG</th>
            <th className="border border-ink/40 px-1.5 py-1.5">NO. KODE LOKASI</th>
            <th className="border border-ink/40 px-1.5 py-1.5">MERK/ TYPE</th>
            <th className="border border-ink/40 px-1.5 py-1.5">DOKUMEN KEPEMILIKAN</th>
            <th className="border border-ink/40 px-1.5 py-1.5">TAHUN BELI/ PEMBELIAN</th>
            <th className="border border-ink/40 px-1.5 py-1.5">HARGA PEROLEHAN</th>
            <th className="border border-ink/40 px-1.5 py-1.5">KEADAAN BARANG (B,KB,RB)</th>
            <th className="border border-ink/40 px-1.5 py-1.5">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          {tampilNihil ? (
            <tr>
              <td
                colSpan={10}
                className="border border-ink/40 px-1.5 py-8 text-center font-display font-bold text-lg tracking-[0.3em] text-ink-soft"
              >
                NIHIL
              </td>
            </tr>
          ) : (
            daftarAset.map((a, i) => (
              <tr key={a.id} className="break-inside-avoid">
                <td className="border border-ink/40 px-1.5 py-1.5 text-center">{i + 1}</td>
                <td className="border border-ink/40 px-1.5 py-1.5">{a.nama}</td>
                <td className="border border-ink/40 px-1.5 py-1.5 font-mono">{a.kode_barang_dinas || a.kode_aset}</td>
                <td className="border border-ink/40 px-1.5 py-1.5 font-mono">
                  {sekolah?.kode_lokasi || "—"}
                </td>
                <td className="border border-ink/40 px-1.5 py-1.5">{a.merk_tipe || ""}</td>
                <td className="border border-ink/40 px-1.5 py-1.5"></td>
                <td className="border border-ink/40 px-1.5 py-1.5 text-center">
                  {a.tahun_perolehan || ""}
                </td>
                <td className="border border-ink/40 px-1.5 py-1.5 text-right">
                  {a.harga_perolehan ? formatAngka(a.harga_perolehan) : ""}
                </td>
                <td className="border border-ink/40 px-1.5 py-1.5 text-center">RB</td>
                <td className="border border-ink/40 px-1.5 py-1.5">{a.catatan || ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <TandaTangan sekolah={sekolah} />
    </div>
  );
}
