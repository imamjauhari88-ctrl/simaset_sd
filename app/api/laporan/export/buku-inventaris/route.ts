import { NextResponse } from "next/server";
import { getLaporanAsetPerKategori } from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { labelAsalUsul } from "@/lib/format";

export async function GET() {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const [daftarAset, sekolah] = await Promise.all([
    getLaporanAsetPerKategori(undefined),
    getSekolahSaya(),
  ]);

  // Kolom & urutan persis format Buku Inventaris dinas. "Bahan" belum
  // ada field-nya di data aset — dikosongkan aja, bukan dihapus
  // kolomnya. Label header digabung "Grup - Anak" (mis. "Nomor - Kode
  // Barang") karena Excel gak punya cara natural nampilin header
  // bertingkat 3 baris kayak di cetak HTML.
  const buffer = buatXlsxLaporan({
    judul: "BUKU INVENTARIS",
    subJudul: [
      `SKPD: ${sekolah?.nama ?? ""}`,
      `Kabupaten/Kota: ${sekolah?.kabupaten_kota || "—"}  |  Provinsi: ${sekolah?.provinsi || "—"}`,
      `No. Kode Lokasi: ${sekolah?.kode_lokasi || "—"}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Nomor - Kode Barang",
      "Nomor - Register",
      "Spesifikasi - Nama/ Jenis Barang",
      "Spesifikasi - Merk/ Type",
      "Spesifikasi - No.Sertifikat/ No.Pabrik/ No.Chasis/ No.Mesin",
      "Spesifikasi - Bahan",
      "Asal/ Cara Perolehan Barang",
      "Tahun Perolehan",
      "Ukuran Barang/ Konstruksi (P,S,D)",
      "Satuan",
      "Keadaan Barang (B/KB/RB)",
      "Jumlah - Barang",
      "Jumlah - Harga",
      "Ket.",
    ],
    baris: daftarAset.map((a, i) => [
      i + 1,
      a.kode_barang_dinas || a.kode_aset,
      a.nomor_register || "",
      a.nama,
      a.merk_tipe || "",
      a.no_sertifikat_dll || "",
      "",
      labelAsalUsul(a.sumber_dana),
      a.tahun_perolehan || "",
      a.ukuran_konstruksi || "",
      "bh",
      a.kondisi === "baik" ? "B" : a.kondisi === "rusak_ringan" ? "KB" : "RB",
      a.stok,
      a.harga_perolehan ?? 0,
      a.catatan || "",
    ]),
    lebarKolom: [4, 14, 10, 26, 14, 24, 10, 18, 10, 18, 8, 12, 10, 16, 20],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Buku-Inventaris.xlsx"`,
    },
  });
}
