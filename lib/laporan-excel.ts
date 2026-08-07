import * as XLSX from "xlsx";

/**
 * Bikin file .xlsx dari header + baris data mentah (array of array),
 * ditambah baris judul & sub-judul di atas sebelum header kolom —
 * niru bentuk kop laporan cetak (nama laporan, nama sekolah, filter).
 * Return-nya Buffer, tinggal dikirim sbg response API route.
 */
export function buatXlsxLaporan({
  judul,
  subJudul,
  header,
  baris,
  lebarKolom,
}: {
  judul: string;
  subJudul: string[];
  header: string[];
  baris: (string | number)[][];
  /** Lebar tiap kolom dalam karakter, urut sesuai `header`. */
  lebarKolom: number[];
}): Buffer {
  const aoa: (string | number)[][] = [
    [judul],
    ...subJudul.map((s) => [s]),
    [],
    header,
    ...baris,
  ];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = lebarKolom.map((wch) => ({ wch }));
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
    ...subJudul.map((_, i) => ({
      s: { r: i + 1, c: 0 },
      e: { r: i + 1, c: header.length - 1 },
    })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Laporan");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
