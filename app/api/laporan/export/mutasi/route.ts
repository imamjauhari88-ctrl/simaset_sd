import { NextRequest, NextResponse } from "next/server";
import { getLaporanMutasi } from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { formatTanggalSingkat } from "@/lib/format";

export async function GET(request: NextRequest) {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const tahunStr = request.nextUrl.searchParams.get("tahun") || undefined;
  const tahun = tahunStr ? Number(tahunStr) : undefined;

  const [daftarMutasi, sekolah] = await Promise.all([
    getLaporanMutasi(tahun),
    getSekolahSaya(),
  ]);

  const buffer = await buatXlsxLaporan({
    judul: "LAPORAN MUTASI ASET",
    subJudul: [
      sekolah?.nama ?? "",
      `Periode: ${tahun ?? "Semua Tahun"}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Tanggal",
      "Kode Aset",
      "Nama Barang",
      "Ruangan Asal",
      "Ruangan Tujuan",
      "Disetujui Oleh",
      "Keterangan",
    ],
    baris: daftarMutasi.map((m, i) => [
      i + 1,
      formatTanggalSingkat(m.tanggal),
      m.aset?.kode_aset || "—",
      m.aset?.nama || "—",
      m.ruangan_asal?.nama || "—",
      m.ruangan_tujuan?.nama || "—",
      m.disetujui_oleh || "—",
      m.keterangan || "—",
    ]),
    lebarKolom: [4, 12, 16, 28, 18, 18, 18, 30],
    sekolah,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Laporan-Mutasi-${tahun ?? "Semua"}.xlsx"`,
    },
  });
}
