import { notFound } from "next/navigation";
import { getAsetTetapList } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { TandaTangan } from "@/app/cetak/tanda-tangan";
import { JUDUL_KIB, KOLOM_KIB, isJenisKib } from "@/lib/laporan-kib-tetap";

export default async function CetakKibTetapPage({
  params,
}: {
  params: Promise<{ jenis: string }>;
}) {
  const { jenis } = await params;
  if (!isJenisKib(jenis)) notFound();

  const [daftar, sekolah] = await Promise.all([
    getAsetTetapList(jenis),
    getSekolahSaya(),
  ]);

  const kolom = KOLOM_KIB[jenis];

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

      {daftar.length === 0 ? (
        <table className="w-full text-[10px] border-collapse border border-ink/40 mb-6">
          <thead>
            <tr className="text-center font-semibold">
              {kolom.map((k) => (
                <th key={k.label} className="border border-ink/40 px-1 py-1">
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={kolom.length}
                className="border border-ink/40 px-1.5 py-8 text-center font-display font-bold text-lg tracking-[0.3em] text-ink-soft"
              >
                NIHIL
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="w-full text-[10px] border-collapse border border-ink/40 mb-6">
          <thead>
            <tr className="text-center font-semibold">
              {kolom.map((k) => (
                <th key={k.label} className="border border-ink/40 px-1 py-1">
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daftar.map((a, i) => (
              <tr key={a.id} className="break-inside-avoid">
                {kolom.map((k) => (
                  <td key={k.label} className="border border-ink/40 px-1 py-1">
                    {k.ambil(a, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-[11px] text-ink-soft mt-6 print:mt-10">
        Dicetak: {new Date().toLocaleString("id-ID")}
      </p>

      <TandaTangan sekolah={sekolah} />
    </div>
  );
}
