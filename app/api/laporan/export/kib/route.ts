import { NextRequest, NextResponse } from "next/server";
import {
  getLaporanAsetPerKategori,
  getKategoriList,
} from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { labelAsalUsul } from "@/lib/format";

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

  // Kolom & urutan persis format KIB B (Peralatan dan Mesin) dinas —
  // No Registrasi/Ukuran/Bahan/Pabrik/Rangka/Mesin/Polisi/BPKB belum
  // ada field-nya di data aset, dikosongkan aja bukan dihapus kolomnya,
  // biar tetap bisa diisi manual di Excel-nya kalau memang ada.
  const buffer = buatXlsxLaporan({
    judul: "KARTU INVENTARIS BARANG (KIB) B — PERALATAN DAN MESIN",
    subJudul: [
      sekolah?.nama ?? "",
      `No. Kode Lokasi: ${sekolah?.kode_lokasi || "—"}`,
      `Kategori: ${namaKategori}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Kode Barang",
      "Nama Barang/ Jenis Barang",
      "Nomor Registrasi",
      "Merk/ Type",
      "Ukuran/ CC",
      "Bahan",
      "Tahun Pembelian",
      "Nomor Pabrik",
      "Nomor Rangka",
      "Nomor Mesin",
      "Nomor Polisi",
      "Nomor BPKB",
      "Asal Usul Cara Perolehan",
      "Harga",
      "Ket.",
    ],
    baris: daftarAset.map((a, i) => [
      i + 1,
      a.kode_aset,
      a.nama,
      "",
      a.merk_tipe || "",
      "",
      "",
      a.tahun_perolehan || "",
      "",
      "",
      "",
      "",
      "",
      labelAsalUsul(a.sumber_dana),
      a.harga_perolehan ?? 0,
      a.catatan || "",
    ]),
    lebarKolom: [4, 14, 26, 14, 16, 10, 10, 10, 10, 10, 10, 10, 10, 18, 14, 20],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="KIB-B-${namaKategori.replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
