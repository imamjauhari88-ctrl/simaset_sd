import { NextResponse } from "next/server";
import { getAsetRusakBerat } from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";

export async function GET() {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const [daftarAset, sekolah] = await Promise.all([
    getAsetRusakBerat(),
    getSekolahSaya(),
  ]);

  const dipaksaNihil = sekolah?.usulan_penghapusan_nihil ?? false;
  const tampilNihil = dipaksaNihil || daftarAset.length === 0;

  const header = [
    "No",
    "Nama Barang",
    "No. Kode Barang",
    "No. Kode Lokasi",
    "Merk/ Type",
    "Dokumen Kepemilikan",
    "Tahun Beli/ Pembelian",
    "Harga Perolehan",
    "Keadaan Barang (B,KB,RB)",
    "Keterangan",
  ];

  const baris = tampilNihil
    ? [["", "NIHIL", "", "", "", "", "", "", "", ""]]
    : daftarAset.map((a, i) => [
        i + 1,
        a.nama,
        a.kode_aset,
        sekolah?.kode_lokasi || "—",
        a.merk_tipe || "",
        "",
        a.tahun_perolehan || "",
        a.harga_perolehan ?? 0,
        "RB",
        a.catatan || "",
      ]);

  const buffer = await buatXlsxLaporan({
    judul: "DAFTAR USULAN BARANG YANG DIHAPUS",
    subJudul: [
      `SKPD: ${sekolah?.nama ?? ""}`,
      `Kab/Kota: ${sekolah?.kabupaten_kota || "—"}  |  Provinsi: ${sekolah?.provinsi || "—"}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header,
    baris,
    lebarKolom: [4, 26, 14, 16, 14, 18, 12, 16, 16, 20],
    sekolah,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Daftar-Usulan-Penghapusan.xlsx"`,
    },
  });
}
