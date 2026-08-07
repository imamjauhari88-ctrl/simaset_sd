import { NextRequest, NextResponse } from "next/server";
import {
  getLaporanAsetPerRuangan,
  getRuanganList,
} from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { labelKondisi } from "@/lib/format";

export async function GET(request: NextRequest) {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const ruanganId = request.nextUrl.searchParams.get("ruangan") || undefined;

  const [daftarAset, sekolah, ruanganList] = await Promise.all([
    getLaporanAsetPerRuangan(ruanganId),
    getSekolahSaya(),
    getRuanganList(),
  ]);

  const namaRuangan = ruanganId
    ? ruanganList.find((r) => r.id === ruanganId)?.nama ?? "—"
    : "Semua Ruangan";

  const totalNilai = daftarAset.reduce(
    (jumlah, a) => jumlah + (a.harga_perolehan ?? 0),
    0
  );

  const buffer = buatXlsxLaporan({
    judul: "KARTU INVENTARIS RUANGAN (KIR)",
    subJudul: [
      sekolah?.nama ?? "",
      `Ruangan: ${namaRuangan}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Kode Aset",
      "Nama Barang",
      "Kategori",
      "Merk/Tipe",
      "Tahun",
      "Harga Perolehan",
      "Kondisi",
    ],
    baris: [
      ...daftarAset.map((a, i) => [
        i + 1,
        a.kode_aset,
        a.nama,
        a.kategori_aset?.nama || "—",
        a.merk_tipe || "—",
        a.tahun_perolehan || "—",
        a.harga_perolehan ?? 0,
        labelKondisi(a.kondisi),
      ]),
      ["", "", "", "", "", "Total", totalNilai, ""],
    ],
    lebarKolom: [4, 16, 28, 18, 20, 8, 18, 14],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Laporan-KIR-${namaRuangan.replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
