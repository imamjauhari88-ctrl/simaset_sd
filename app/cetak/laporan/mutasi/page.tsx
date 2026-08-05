import { getLaporanMutasi } from "@/lib/supabase/queries";
import { getSekolahSaya } from "@/lib/tenant/context";
import { TombolCetak } from "@/app/cetak/tombol-cetak";
import { formatTanggalSingkat } from "@/lib/format";

export default async function CetakLaporanMutasiPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const { tahun: tahunStr } = await searchParams;
  const tahun = tahunStr ? Number(tahunStr) : undefined;

  const [daftarMutasi, sekolah] = await Promise.all([
    getLaporanMutasi(tahun),
    getSekolahSaya(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <TombolCetak />

      <div className="text-center mb-6">
        <p className="font-display font-semibold text-ink text-lg">
          LAPORAN MUTASI ASET
        </p>
        <p className="text-sm text-ink-soft">{sekolah?.nama ?? ""}</p>
        {sekolah?.alamat && (
          <p className="text-[12px] text-ink-soft">{sekolah.alamat}</p>
        )}
        {sekolah?.npsn && (
          <p className="text-[12px] text-ink-soft">NPSN: {sekolah.npsn}</p>
        )}
        <p className="text-[13px] text-ink mt-2 font-medium">
          Periode: {tahun ?? "Semua Tahun"}
        </p>
      </div>

      {daftarMutasi.length === 0 ? (
        <p className="text-ink-soft text-sm text-center">
          Tidak ada data mutasi untuk periode ini.
        </p>
      ) : (
        <>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b-2 border-ink/30 text-left">
                <th className="py-2 pr-2 w-8">No</th>
                <th className="py-2 pr-2">Tanggal</th>
                <th className="py-2 pr-2">Kode Aset</th>
                <th className="py-2 pr-2">Nama Barang</th>
                <th className="py-2 pr-2">Ruangan Asal</th>
                <th className="py-2 pr-2">Ruangan Tujuan</th>
                <th className="py-2 pr-2">Disetujui Oleh</th>
                <th className="py-2 pr-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {daftarMutasi.map((m, i) => (
                <tr key={m.id} className="border-b border-line break-inside-avoid">
                  <td className="py-1.5 pr-2 text-ink-soft">{i + 1}</td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {formatTanggalSingkat(m.tanggal)}
                  </td>
                  <td className="py-1.5 pr-2 font-mono">
                    {m.aset?.kode_aset || "—"}
                  </td>
                  <td className="py-1.5 pr-2">{m.aset?.nama || "—"}</td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {m.ruangan_asal?.nama || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {m.ruangan_tujuan?.nama || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {m.disetujui_oleh || "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-ink-soft">
                    {m.keterangan || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[11px] text-ink-soft mt-6 print:mt-10">
            Dicetak: {new Date().toLocaleString("id-ID")}
          </p>
        </>
      )}
    </div>
  );
}
