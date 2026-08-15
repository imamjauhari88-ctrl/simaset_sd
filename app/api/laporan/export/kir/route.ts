import { NextRequest, NextResponse } from "next/server";
import {
  getLaporanAsetPerRuangan,
  getRuanganList,
} from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { gabungkanBarisSerupa } from "@/lib/laporan-adapter";

export async function GET(request: NextRequest) {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const ruanganId = request.nextUrl.searchParams.get("ruangan") || undefined;

  const [daftarAsetMentah, sekolah, ruanganList] = await Promise.all([
    getLaporanAsetPerRuangan(ruanganId),
    getSekolahSaya(),
    getRuanganList(),
  ]);

  const daftarAset = gabungkanBarisSerupa(daftarAsetMentah);

  const namaRuangan = ruanganId
    ? ruanganList.find((r) => r.id === ruanganId)?.nama ?? "—"
    : "Semua Ruangan";

  // Kolom & urutan persis format KIR dinas — Merk/Model, No Seri Pabrik,
  // Ukuran belum ada field-nya di data aset (sama kayak KIB B),
  // dikosongkan aja bukan dihapus kolomnya. "Keadaan Barang" beneran
  // digabung jadi grup 3 sub-kolom (B/KB/RB), sama persis versi cetak.
  // Barang identik di ruangan yang sama digabung jadi 1 baris, sama
  // kayak Buku Inventaris & KIB.
  const buffer = await buatXlsxLaporan({
    judul: "KARTU INVENTARIS RUANGAN (KIR)",
    subJudul: [
      `Provinsi: ${sekolah?.provinsi || "—"}  |  Kab/Kota: ${sekolah?.kabupaten_kota || "—"}`,
      `Satuan Kerja: ${sekolah?.nama ?? ""}`,
      `Ruangan: ${namaRuangan}`,
      `No. Kode Lokasi: ${sekolah?.kode_lokasi || "—"}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: [
      "No",
      "Kode Barang",
      "Nama Barang/ Jenis Barang",
      "Merk/ Model",
      "No. Seri Pabrik",
      "Ukuran",
      "Bahan",
      "Tahun Pembuatan/ Pembelian",
      "Jumlah Barang/ Register",
      "Harga Beli/ Perolehan",
      { label: "Keadaan Barang", anak: ["Baik (B)", "Kurang Baik (KB)", "Rusak Berat (RB)"] },
      "Keterangan Mutasi",
    ],
    baris: daftarAset.map(({ contoh: a, jumlah, hargaTotal, registerGabungan }, i) => [
      i + 1,
      a.kode_barang_dinas || a.kode_aset,
      a.nama,
      a.merk_tipe || "",
      a.no_sertifikat_dll || "",
      a.ukuran_konstruksi || "",
      a.bahan || "",
      a.tahun_perolehan || "",
      registerGabungan || jumlah,
      hargaTotal ?? 0,
      a.kondisi === "baik" ? jumlah : "",
      a.kondisi === "rusak_ringan" ? jumlah : "",
      a.kondisi === "rusak_berat" ? jumlah : "",
      a.catatan || "",
    ]),
    lebarKolom: [4, 14, 26, 14, 14, 10, 10, 12, 10, 16, 8, 12, 12, 20],
    sekolah,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Laporan-KIR-${namaRuangan.replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
