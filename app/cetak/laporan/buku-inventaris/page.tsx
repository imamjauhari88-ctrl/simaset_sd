import { getLaporanAsetPerKategori } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { formatAngka, labelAsalUsul } from "@/lib/format";

/** Rekap SEMUA aset lintas kategori jadi satu daftar — beda dari KIB
 * (per kategori A-F) & KIR (per ruangan). Kolom No.Sertifikat/No.Pabrik/
 * No.Chasis/No.Mesin & Ukuran Barang/Konstruksi belum ada field-nya di
 * data aset (khusus tanah/kendaraan/bangunan, ditangani terpisah lewat
 * KIB A/C/D nanti) — dikosongkan dulu, bukan dihapus kolomnya. */
export default async function CetakBukuInventarisPage() {
  const [daftarAset, sekolah] = await Promise.all([
    getLaporanAsetPerKategori(undefined),
    getSekolahSaya(),
  ]);

  return (
    <div className="cetak-landscape max-w-[1400px] mx-auto">
      <TombolCetak />

      <div className="text-center mb-3">
        <p className="font-display font-bold text-ink text-base uppercase">
          Buku Inventaris
        </p>
      </div>

      <div className="text-[12px] mb-3 grid grid-cols-[auto_1fr] gap-x-2 w-fit">
        <span>SKPD</span>
        <span>: {sekolah?.nama ?? "—"}</span>
        <span>KABUPATEN/KOTA</span>
        <span>: {sekolah?.kabupaten_kota || "—"}</span>
        <span>PROVINSI</span>
        <span>: {sekolah?.provinsi || "—"}</span>
      </div>

      <p className="text-[12px] text-ink font-medium mb-3">
        NO. KODE LOKASI :{" "}
        <span className="font-mono">{sekolah?.kode_lokasi || "—"}</span>
      </p>

      {daftarAset.length === 0 ? (
        <p className="text-ink-soft text-sm text-center">
          Belum ada aset tercatat.
        </p>
      ) : (
        <>
          <table className="w-full text-[10px] border-collapse border border-ink/40">
            <thead>
              <tr className="text-center font-semibold">
                <th className="border border-ink/40 px-1 py-1 w-7">NO</th>
                <th className="border border-ink/40 px-1 py-1">KODE BARANG</th>
                <th className="border border-ink/40 px-1 py-1">REGISTER</th>
                <th className="border border-ink/40 px-1 py-1">NAMA/ JENIS BARANG</th>
                <th className="border border-ink/40 px-1 py-1">MERK/ TYPE</th>
                <th className="border border-ink/40 px-1 py-1">NO.SERTIFIKAT/ NO.PABRIK/ NO.CHASIS/ NO.MESIN</th>
                <th className="border border-ink/40 px-1 py-1">BAHAN</th>
                <th className="border border-ink/40 px-1 py-1">ASAL/ CARA PEROLEHAN BARANG</th>
                <th className="border border-ink/40 px-1 py-1">TAHUN PEROLEHAN</th>
                <th className="border border-ink/40 px-1 py-1">UKURAN BARANG/ KONSTRUKSI (P,S,D)</th>
                <th className="border border-ink/40 px-1 py-1">SATUAN</th>
                <th className="border border-ink/40 px-1 py-1">KEADAAN BARANG (B/KB/RB)</th>
                <th className="border border-ink/40 px-1 py-1">JUMLAH BARANG</th>
                <th className="border border-ink/40 px-1 py-1">HARGA</th>
                <th className="border border-ink/40 px-1 py-1">KET.</th>
              </tr>
              <tr className="text-center text-ink-soft">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
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
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1">{a.nama}</td>
                  <td className="border border-ink/40 px-1 py-1">{a.merk_tipe || ""}</td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1">{labelAsalUsul(a.sumber_dana)}</td>
                  <td className="border border-ink/40 px-1 py-1 text-center">{a.tahun_perolehan || ""}</td>
                  <td className="border border-ink/40 px-1 py-1"></td>
                  <td className="border border-ink/40 px-1 py-1 text-center">bh</td>
                  <td className="border border-ink/40 px-1 py-1 text-center">
                    {a.kondisi === "baik" ? "B" : a.kondisi === "rusak_ringan" ? "KB" : "RB"}
                  </td>
                  <td className="border border-ink/40 px-1 py-1 text-center">{a.stok}</td>
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
