import ExcelJS from "exceljs";
import type { Sekolah } from "@/types/database";

/**
 * Bikin file .xlsx dari header + baris data, ngikutin PERSIS struktur
 * layout kop versi cetak HTML — bukan disamain rata (dulu semua baris
 * info dipukul-rata jadi 1 gaya "centered", padahal versi cetak
 * sebenernya campuran 2 gaya berbeda tergantung laporannya):
 *
 *   - `infoKiri`      -> grid rata KIRI "Label : Nilai" (dipakai KIR,
 *                        Buku Inventaris, Daftar Usulan — cocokin sama
 *                        `grid grid-cols-[auto_1fr]` di JSX-nya)
 *   - `subJudulTengah`-> baris rata TENGAH biasa (dipakai KIB B & Mutasi
 *                        — cocokin sama `text-center` di JSX-nya)
 *   - `kodeLokasi`    -> baris "NO. KODE LOKASI : X" tersendiri, SELALU
 *                        rata kiri (KIR/Buku Inventaris/KIB pakai ini,
 *                        posisinya emang gak digabung ke blok di atas
 *                        di versi cetak, jadi ditulis terpisah)
 *
 * "Dicetak: <waktu>" juga BUKAN bagian kop lagi — di versi cetak itu
 * ada di FOOTER (bawah tabel, sebelum blok tanda tangan), makanya di
 * sini otomatis ditaruh di situ juga, bukan digabung ke info atas.
 *
 * Sengaja pindah dari `xlsx` (SheetJS) ke `exceljs` — versi gratis
 * SheetJS itu gak bisa nulis border/style ke file .xlsx (fitur itu
 * di-lock ke versi berbayarnya), sedangkan exceljs full gratis dan
 * emang didesain buat kebutuhan kayak gini (border, merge cell, bold,
 * fill warna header).
 *
 * Semua konten digeser mulai dari KOLOM B (bukan A) — kolom A dibiarin
 * kosong sebagai margin kiri, biar ada "napas" kayak padding di versi
 * cetak, bukan nempel langsung ke tepi jendela Excel.
 */

export type HeaderKolom = string | { label: string; anak: string[] };

const GARIS_TIPIS: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FF9A9488" } };
const BORDER_SEMUA: Partial<ExcelJS.Borders> = {
  top: GARIS_TIPIS,
  left: GARIS_TIPIS,
  bottom: GARIS_TIPIS,
  right: GARIS_TIPIS,
};

const KOLOM_MARGIN = 1; // kolom A jadi margin kosong; konten mulai kolom B
const LEBAR_MARGIN = 2.5;

export async function buatXlsxLaporan({
  judul,
  infoKiri,
  subJudulTengah,
  kodeLokasi,
  header,
  baris,
  lebarKolom,
  sekolah,
}: {
  judul: string;
  /** Grid rata kiri "Label : Nilai", satu per baris — dipakai laporan
   * yang di versi cetaknya pakai `grid grid-cols-[auto_1fr]` (KIR,
   * Buku Inventaris, Daftar Usulan). */
  infoKiri?: { label: string; nilai: string }[];
  /** Baris teks biasa rata TENGAH — dipakai laporan yang di versi
   * cetaknya pakai `text-center` buat blok info sekolah (KIB B, Mutasi). */
  subJudulTengah?: string[];
  /** Baris "NO. KODE LOKASI : X" — selalu rata kiri, digambar terpisah
   * dari blok info di atasnya (sesuai posisinya di versi cetak). */
  kodeLokasi?: string;
  /** String biasa buat kolom tunggal, atau `{label, anak}` buat kolom
   * yang jadi 1 grup dengan beberapa sub-kolom (mis. "Nomor" pecah
   * jadi "Kode Barang" + "Register") — header-nya otomatis jadi 2
   * baris dengan sel digabung (merge), persis versi cetak HTML-nya. */
  header: HeaderKolom[];
  baris: (string | number)[][];
  /** Lebar tiap kolom dalam karakter, urut sesuai kolom hasil ratakan
   * (bukan sesuai `header` kalau ada grup — satu per kolom LEAF). */
  lebarKolom: number[];
  /** Buat blok tanda tangan "MENGETAHUI/PENGURUS BARANG" + baris
   * "Dicetak: ..." di footer — sama datanya kayak yang diisi di
   * Pengaturan > Info Sekolah, dipakai berulang di <TandaTangan> versi
   * cetak. Opsional: kalau gak dikasih, dua-duanya dilewat (mis.
   * laporan ringkasan super admin yang emang bukan format dinas). */
  sekolah?: Sekolah | null;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan");

  sheet.getColumn(KOLOM_MARGIN).width = LEBAR_MARGIN;

  const totalKolom = header.reduce(
    (n, h) => n + (typeof h === "string" ? 1 : h.anak.length),
    0
  );
  const kolomTerakhir = KOLOM_MARGIN + totalKolom;
  const adaGrup = header.some((h) => typeof h !== "string");
  const jumlahBarisHeader = adaGrup ? 2 : 1;

  let baris_ke = 1;

  function tulisBarisGabung(teks: string, opsi: { tebal?: boolean; ukuran?: number; rata?: "left" | "center" } = {}) {
    sheet.mergeCells(baris_ke, KOLOM_MARGIN + 1, baris_ke, kolomTerakhir);
    const sel = sheet.getCell(baris_ke, KOLOM_MARGIN + 1);
    sel.value = teks;
    sel.font = { bold: opsi.tebal ?? false, size: opsi.ukuran ?? 10 };
    sel.alignment = { horizontal: opsi.rata ?? "center", vertical: "middle" };
    sheet.getRow(baris_ke).height = opsi.tebal ? 26 : 20;
    baris_ke++;
  }

  tulisBarisGabung(judul, { tebal: true, ukuran: 14 });
  baris_ke++; // sedikit jarak antara judul & info di bawahnya

  if (infoKiri && infoKiri.length > 0) {
    for (const { label, nilai } of infoKiri) {
      sheet.getCell(baris_ke, KOLOM_MARGIN + 1).value = label;
      sheet.getCell(baris_ke, KOLOM_MARGIN + 2).value = `: ${nilai}`;
      sheet.getRow(baris_ke).height = 18;
      baris_ke++;
    }
  }

  if (subJudulTengah) {
    for (const s of subJudulTengah) tulisBarisGabung(s, { rata: "center" });
  }

  if (kodeLokasi) {
    baris_ke++; // jarak sebelum baris kode lokasi, sama kayak versi cetak
    sheet.getCell(baris_ke, KOLOM_MARGIN + 1).value = `NO. KODE LOKASI : ${kodeLokasi}`;
    sheet.getCell(baris_ke, KOLOM_MARGIN + 1).font = { bold: true, size: 10 };
    sheet.getRow(baris_ke).height = 20;
    baris_ke++;
  }

  baris_ke += 1; // jarak lebih lega sebelum tabel mulai

  // ===== Header kolom (1 atau 2 baris, tergantung ada grup atau enggak) =====
  const barisHeaderAwal = baris_ke;
  let kolomKe = KOLOM_MARGIN + 1;
  for (const h of header) {
    if (typeof h === "string") {
      sheet.mergeCells(
        barisHeaderAwal,
        kolomKe,
        barisHeaderAwal + jumlahBarisHeader - 1,
        kolomKe
      );
      sheet.getCell(barisHeaderAwal, kolomKe).value = h;
      kolomKe++;
    } else {
      sheet.mergeCells(barisHeaderAwal, kolomKe, barisHeaderAwal, kolomKe + h.anak.length - 1);
      sheet.getCell(barisHeaderAwal, kolomKe).value = h.label;
      h.anak.forEach((label, i) => {
        sheet.getCell(barisHeaderAwal + 1, kolomKe + i).value = label;
      });
      kolomKe += h.anak.length;
    }
  }

  for (let r = barisHeaderAwal; r < barisHeaderAwal + jumlahBarisHeader; r++) {
    for (let c = KOLOM_MARGIN + 1; c <= kolomTerakhir; c++) {
      const sel = sheet.getCell(r, c);
      sel.font = { bold: true, size: 10 };
      sel.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      sel.border = BORDER_SEMUA;
      sel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F1EA" } };
    }
  }

  // ===== Baris data =====
  const barisDataAwal = barisHeaderAwal + jumlahBarisHeader;
  baris.forEach((row, i) => {
    row.forEach((nilai, j) => {
      const sel = sheet.getCell(barisDataAwal + i, KOLOM_MARGIN + 1 + j);
      sel.value = nilai;
      sel.border = BORDER_SEMUA;
      sel.font = { size: 10 };
      sel.alignment = { vertical: "middle", wrapText: true };
    });
  });

  lebarKolom.forEach((wch, i) => {
    sheet.getColumn(KOLOM_MARGIN + 1 + i).width = wch;
  });
  sheet.getRow(barisHeaderAwal).height = jumlahBarisHeader === 2 ? 28 : 20;

  let barisSetelahTabel = barisDataAwal + baris.length;

  // ===== Footer "Dicetak: ..." — sama posisinya kayak versi cetak
  // (di bawah tabel, sebelum tanda tangan, rata kiri) =====
  if (sekolah !== undefined) {
    barisSetelahTabel += 2;
    const selDicetak = sheet.getCell(barisSetelahTabel, KOLOM_MARGIN + 1);
    selDicetak.value = `Dicetak: ${new Date().toLocaleString("id-ID")}`;
    selDicetak.font = { size: 9, italic: true };
    barisSetelahTabel++;
  }

  // ===== Blok tanda tangan — sama persis <TandaTangan> versi cetak =====
  if (sekolah !== undefined) {
    let barisTtd = barisSetelahTabel + 2;
    const tengahKiri = KOLOM_MARGIN + 1 + Math.floor((totalKolom - 1) / 4);
    const tengahKanan = KOLOM_MARGIN + 1 + Math.floor((totalKolom * 3) / 4);
    const kabKota = sekolah?.kabupaten_kota || "…………………";
    const tanggal = (
      sekolah?.tanggal_laporan ? new Date(sekolah.tanggal_laporan) : new Date()
    ).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    function tulisTtd(kolom: number, baris: number, teks: string, tebal = false) {
      const sel = sheet.getCell(baris, kolom);
      sel.value = teks;
      sel.font = { bold: tebal, size: 10 };
      sel.alignment = { horizontal: "center" };
    }

    tulisTtd(tengahKiri, barisTtd, "MENGETAHUI");
    tulisTtd(tengahKanan, barisTtd, `${kabKota}, ${tanggal}`);
    barisTtd++;
    tulisTtd(
      tengahKiri,
      barisTtd,
      `KEPALA ${sekolah?.nama ? sekolah.nama.toUpperCase() : "SEKOLAH"}`,
      true
    );
    tulisTtd(tengahKanan, barisTtd, "PENGURUS BARANG", true);
    barisTtd += 5; // spasi kosong buat tanda tangan asli
    tulisTtd(
      tengahKiri,
      barisTtd,
      sekolah?.kepala_sekolah_nama || "…………………………",
      true
    );
    tulisTtd(
      tengahKanan,
      barisTtd,
      sekolah?.pengurus_barang_nama || "…………………………",
      true
    );
    barisTtd++;
    tulisTtd(tengahKiri, barisTtd, `NIP. ${sekolah?.kepala_sekolah_nip || "……………………"}`);
    tulisTtd(tengahKanan, barisTtd, `NIP. ${sekolah?.pengurus_barang_nip || "……………………"}`);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
