import { notFound } from "next/navigation";
import { getAsetTetapList, getAsetByKodeKib } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { tetapDariAset } from "@/lib/laporan-adapter";
import { JUDUL_KIB, KOLOM_KIB, isGroup, ratakanKolom, isJenisKib } from "@/lib/laporan-kib-tetap";

/** Gabungan 2 sumber data: Aset Tetap Khusus (tabel `aset_tetap`,
 * jenis_kib match) DAN Data Aset harian yang kategorinya ditandai
 * kode_kib huruf yang sama (mis. kategori "Alat Kesenian" ditandai
 * KIB E, harusnya muncul juga di laporan KIB E ini walau dicatat
 * lewat Data Aset biasa, bukan Aset Tetap Khusus). Diurutkan gabungan
 * berdasar tanggal input (bukan per-sumber) biar nomor urutnya masuk
 * akal sebagai satu daftar. */
export default async function CetakKibTetapPage({
  params,
}: {
  params: Promise<{ jenis: string }>;
}) {
  const { jenis } = await params;
  if (!isJenisKib(jenis)) notFound();

  const [daftarTetap, daftarAsetKategori, sekolah] = await Promise.all([
    getAsetTetapList(jenis),
    getAsetByKodeKib(jenis),
    getSekolahSaya(),
  ]);

  const daftar = [
    ...daftarTetap,
    ...daftarAsetKategori.map((a) => tetapDariAset(a, jenis)),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const kolom = KOLOM_KIB[jenis];
  const leafKolom = ratakanKolom(kolom);
  const adaGrup = kolom.some(isGroup);

  return (
    <div className="cetak-landscape max-w-[1400px] mx-auto">
      <TombolCetak />

      <div className="text-center mb-3">
        <p className="font-display font-bold text-ink text-base uppercase">
          Kartu Inventaris Barang (KIB) {jenis}
        </p>
        <p className="font-display font-semibold text-ink text-sm uppercase">
          {JUDUL_KIB[jenis]}
        </p>
      </div>

      <p className="text-[12px] text-ink font-medium mb-3">
        NO. KODE LOKASI :{" "}
        <span className="font-mono">{sekolah?.kode_lokasi || "—"}</span>
      </p>

      <table className="w-full text-[10px] border-collapse border border-ink/40 mb-6">
        <thead>
          <tr className="text-center font-semibold">
            {kolom.map((k) =>
              isGroup(k) ? (
                <th key={k.label} colSpan={k.anak.length} className="border border-ink/40 px-1 py-1">
                  {k.label}
                </th>
              ) : (
                <th
                  key={k.label}
                  rowSpan={adaGrup ? 2 : 1}
                  className="border border-ink/40 px-1 py-1"
                >
                  {k.label}
                </th>
              )
            )}
          </tr>
          {adaGrup && (
            <tr className="text-center font-semibold">
              {kolom.filter(isGroup).flatMap((g) =>
                g.anak.map((a) => (
                  <th key={`${g.label}-${a.label}`} className="border border-ink/40 px-1 py-1">
                    {a.label}
                  </th>
                ))
              )}
            </tr>
          )}
          <tr className="text-center text-ink-soft">
            {leafKolom.map((_k, idx) => (
              <th key={idx} className="border border-ink/40 px-1 py-0.5 font-normal">
                {idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daftar.length === 0 ? (
            <tr>
              <td
                colSpan={leafKolom.length}
                className="border border-ink/40 px-1.5 py-8 text-center font-display font-bold text-lg tracking-[0.3em] text-ink-soft"
              >
                NIHIL
              </td>
            </tr>
          ) : (
            daftar.map((a, i) => (
              <tr key={a.id} className="break-inside-avoid">
                {leafKolom.map((k) => (
                  <td key={k.label} className="border border-ink/40 px-1 py-1">
                    {k.ambil(a, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="text-[11px] text-ink-soft mt-6 print:mt-10">
        Dicetak: {new Date().toLocaleString("id-ID")}
      </p>

      <TandaTangan sekolah={sekolah} />
    </div>
  );
}
