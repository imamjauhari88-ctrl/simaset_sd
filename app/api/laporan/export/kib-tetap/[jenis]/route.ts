import { NextRequest, NextResponse } from "next/server";
import { getAsetTetapList } from "@/lib/supabase/queries";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { buatXlsxLaporan } from "@/lib/laporan-excel";
import { JUDUL_KIB, KOLOM_KIB, isJenisKib } from "@/lib/laporan-kib-tetap";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jenis: string }> }
) {
  const profil = await getProfilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { jenis } = await params;
  if (!isJenisKib(jenis)) {
    return NextResponse.json({ error: "Jenis KIB tidak dikenali." }, { status: 400 });
  }

  const [daftar, sekolah] = await Promise.all([
    getAsetTetapList(jenis),
    getSekolahSaya(),
  ]);

  const kolom = KOLOM_KIB[jenis];

  const buffer = buatXlsxLaporan({
    judul: `KARTU INVENTARIS BARANG (KIB) ${jenis} — ${JUDUL_KIB[jenis].toUpperCase()}`,
    subJudul: [
      `No. Kode Lokasi: ${sekolah?.kode_lokasi || "—"}`,
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
    ],
    header: kolom.map((k) => k.label),
    baris:
      daftar.length === 0
        ? [["", "NIHIL", ...Array(kolom.length - 2).fill("")]]
        : daftar.map((a, i) => kolom.map((k) => k.ambil(a, i))),
    lebarKolom: kolom.map((k) => k.lebar ?? 14),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="KIB-${jenis}.xlsx"`,
    },
  });
}
