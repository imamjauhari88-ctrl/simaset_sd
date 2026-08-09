import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getDaftarSekolahUntukSuperAdmin } from "@/lib/queries/super-admin";
import { buatXlsxLaporan } from "@/lib/laporan-excel";

/** Export ringkasan sekolah (nama, admin, tgl daftar, jml aset, jml user,
 * status) ke satu file Excel — laporan global paling umum dibutuhkan
 * super admin buat dibawa ke rapat/dilaporkan ke atasan.
 *
 * Terima query param opsional `?sekolahId=` — kalau diisi, laporan
 * di-scope ke satu sekolah aja (dipakai dari filter di /super-admin/analitik). */
export async function GET(request: NextRequest) {
  await requireSuperAdmin();

  const sekolahId = request.nextUrl.searchParams.get("sekolahId") || undefined;
  const daftar = await getDaftarSekolahUntukSuperAdmin(sekolahId);
  const judulScope = sekolahId
    ? `RINGKASAN SEKOLAH — ${(daftar[0]?.nama ?? "SATU TENANT").toUpperCase()}`
    : "RINGKASAN SEKOLAH — SEMUA TENANT";

  const buffer = buatXlsxLaporan({
    judul: judulScope,
    subJudul: [
      "SIMASET SD — Panel Super Admin",
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
      `Total sekolah: ${daftar.length}`,
    ],
    header: [
      "No",
      "Nama Sekolah",
      "NPSN",
      "Alamat",
      "Email Admin",
      "Tgl Daftar",
      "Jml Aset",
      "Jml User",
      "Status",
    ],
    baris: daftar.map((s, i) => [
      i + 1,
      s.nama,
      s.npsn || "",
      s.alamat || "",
      s.admin?.email || "",
      new Date(s.created_at).toLocaleDateString("id-ID"),
      s.jumlahAset,
      s.jumlahUser,
      s.status === "aktif" ? "Aktif" : "Nonaktif",
    ]),
    lebarKolom: [4, 28, 14, 30, 26, 14, 10, 10, 10],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ringkasan-sekolah-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
