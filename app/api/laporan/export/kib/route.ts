import { NextRequest, NextResponse } from "next/server";
import {
  getLaporanAsetPerKategori,
  getKategoriList,
} from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { labelKondisi } from "@/lib/format";

export async function GET(request: NextRequest) {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const kategoriId = request.nextUrl.searchParams.get("kategori") || undefined;

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

  const buffer = buatXlsxLaporan({
    judul: "KARTU INVENTARIS BARANG (KIB)",
    subJudul: [
      sekolah?.nama ?? "",
      `Kategori: ${namaKategori}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Kode Aset",
      "Nama Barang",
      "Merk/Tipe",
      "Ruangan",
      "Tahun",
      "Sumber Dana",
      "Harga Perolehan",
      "Kondisi",
    ],
    baris: [
      ...daftarAset.map((a, i) => [
        i + 1,
        a.kode_aset,
        a.nama,
        a.merk_tipe || "—",
        a.ruangan?.nama || "—",
        a.tahun_perolehan || "—",
        (a.sumber_dana || "—").toUpperCase(),
        a.harga_perolehan ?? 0,
        labelKondisi(a.kondisi),
      ]),
      ["", "", "", "", "", "", "Total", totalNilai, ""],
    ],
    lebarKolom: [4, 16, 28, 20, 18, 8, 12, 18, 14],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Laporan-KIB-${namaKategori.replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
