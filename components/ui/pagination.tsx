"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Kata benda buat teks "Menampilkan X–Y dari Z <label>" — beda tiap
   * halaman (aset/mutasi/peminjaman/catatan pemeliharaan). Default "aset"
   * biar konsisten sama teks lama, tapi harusnya selalu diisi eksplisit. */
  label?: string;
}

/** Bikin daftar nomor halaman dengan "..." kalau halamannya banyak,
 * supaya tidak render ratusan tombol saat data ribuan baris. */
function buatNomorHalaman(page: number, totalHalaman: number): (number | "...")[] {
  const hasil: (number | "...")[] = [];
  const rentang = 1;

  for (let i = 1; i <= totalHalaman; i++) {
    const dekatAwal = i === 1;
    const dekatAkhir = i === totalHalaman;
    const dekatSaatIni = i >= page - rentang && i <= page + rentang;

    if (dekatAwal || dekatAkhir || dekatSaatIni) {
      hasil.push(i);
    } else if (hasil[hasil.length - 1] !== "...") {
      hasil.push("...");
    }
  }
  return hasil;
}

export function Pagination({ page, pageSize, total, onPageChange, label = "aset" }: PaginationProps) {
  const totalHalaman = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const dari = (page - 1) * pageSize + 1;
  const sampai = Math.min(page * pageSize, total);
  const nomorHalaman = buatNomorHalaman(page, totalHalaman);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-line">
      <p className="text-[13px] text-ink-soft">
        Menampilkan <span className="text-ink font-medium">{dari}–{sampai}</span> dari{" "}
        <span className="text-ink font-medium">{total}</span> {label}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center size-8 rounded-lg border border-line text-ink-soft hover:bg-paper disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {nomorHalaman.map((n, idx) =>
          n === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-ink-soft text-sm">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`inline-flex items-center justify-center size-8 rounded-lg text-sm font-medium transition-colors ${
                n === page
                  ? "bg-pine text-white"
                  : "text-ink-soft border border-line hover:bg-paper"
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalHalaman}
          className="inline-flex items-center justify-center size-8 rounded-lg border border-line text-ink-soft hover:bg-paper disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
