import ExcelJS from "exceljs";

/**
 * Bikin file .xlsx dari header + baris data, mirip persis bentuk cetak
 * HTML-nya: kop judul, header kolom (bisa bertingkat 2 baris kalau ada
 * grup), dan garis pinggir di semua sel — bukan cuma teks polos.
 *
 * Sengaja pindah dari `xlsx` (SheetJS) ke `exceljs` — versi gratis
 * SheetJS itu gak bisa nulis border/style ke file .xlsx (fitur itu
 * di-lock ke versi berbayarnya), sedangkan exceljs full gratis dan
 * emang didesain buat kebutuhan kayak gini (border, merge cell, bold,
 * fill warna header).
 */

export type HeaderKolom = string | { label: string; anak: string[] };

const GARIS_TIPIS: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FF9A9488" } };
const BORDER_SEMUA: Partial<ExcelJS.Borders> = {
  top: GARIS_TIPIS,
  left: GARIS_TIPIS,
  bottom: GARIS_TIPIS,
  right: GARIS_TIPIS,
};

export async function buatXlsxLaporan({
  judul,
  subJudul,
  header,
  baris,
  lebarKolom,
}: {
  judul: string;
  subJudul: string[];
  /** String biasa buat kolom tunggal, atau `{label, anak}` buat kolom
   * yang jadi 1 grup dengan beberapa sub-kolom (mis. "Nomor" pecah
   * jadi "Kode Barang" + "Register") — header-nya otomatis jadi 2
   * baris dengan sel digabung (merge), persis versi cetak HTML-nya. */
  header: HeaderKolom[];
  baris: (string | number)[][];
  /** Lebar tiap kolom dalam karakter, urut sesuai kolom hasil ratakan
   * (bukan sesuai `header` kalau ada grup — satu per kolom LEAF). */
  lebarKolom: number[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan");

  const totalKolom = header.reduce(
    (n, h) => n + (typeof h === "string" ? 1 : h.anak.length),
    0
  );
  const adaGrup = header.some((h) => typeof h !== "string");
  const jumlahBarisHeader = adaGrup ? 2 : 1;

  let baris_ke = 1;

  function gabungBarisPenuh(teks: string, tebal: boolean) {
    sheet.mergeCells(baris_ke, 1, baris_ke, totalKolom);
    const sel = sheet.getCell(baris_ke, 1);
    sel.value = teks;
    sel.font = { bold: tebal, size: tebal ? 13 : 10 };
    sel.alignment = { horizontal: "center" };
    baris_ke++;
  }

  gabungBarisPenuh(judul, true);
  for (const s of subJudul) gabungBarisPenuh(s, false);
  baris_ke++; // baris kosong pemisah

  // ===== Header kolom (1 atau 2 baris, tergantung ada grup atau enggak) =====
  const barisHeaderAwal = baris_ke;
  let kolomKe = 1;
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
    for (let c = 1; c <= totalKolom; c++) {
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
      const sel = sheet.getCell(barisDataAwal + i, j + 1);
      sel.value = nilai;
      sel.border = BORDER_SEMUA;
      sel.font = { size: 10 };
      sel.alignment = { vertical: "middle", wrapText: true };
    });
  });

  lebarKolom.forEach((wch, i) => {
    sheet.getColumn(i + 1).width = wch;
  });
  sheet.getRow(barisHeaderAwal).height = jumlahBarisHeader === 2 ? 28 : 20;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
