import { NextRequest, NextResponse } from "next/server";
import {
  getLaporanAsetPerKategori,
  getAsetByKodeKib,
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
    kategoriId ? getLaporanAsetPerKategori(kategoriId) : getAsetByKodeKib("B"),
    getSekolahSaya(),
    getKategoriList(),
  ]);

  const namaKategori = kategoriId
    ? kategoriList.find((k) => k.id === kategoriId)?.nama ?? "—"
    : "Semua Kategori (Peralatan dan Mesin)";

  // Kolom & urutan persis format KIB B (Peralatan dan Mesin) dinas —
  // Pabrik/Rangka/Mesin/Polisi/BPKB belum ada field terpisah di data
  // aset (dianggap 1 kolom gabungan "No.Sertifikat/dll" di form),
  // dikosongkan aja di sini, bukan dihapus kolomnya.
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
      a.kode_barang_dinas || a.kode_aset,
      a.nama,
      a.nomor_register || "",
      a.merk_tipe || "",
      a.ukuran_konstruksi || "",
      a.bahan || "",
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
