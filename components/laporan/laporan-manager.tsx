"use client";

import { useState } from "react";
import { FileBarChart, ArrowLeftRight, Printer, FileSpreadsheet, BookOpen, FileX2 } from "lucide-react";
import type { KategoriAset, Ruangan } from "@/types/database";
import { daftarTahunOpsi } from "@/lib/format";
import { LABEL_JENIS_KIB } from "@/lib/validasi/aset-tetap";
import { Select } from "@/components/ui/select";

const OPSI_TAHUN = daftarTahunOpsi();
const OPSI_JENIS_KIB = [
  { value: "A", label: `${LABEL_JENIS_KIB.A.pendek} — ${LABEL_JENIS_KIB.A.label}` },
  { value: "B", label: "KIB B — Peralatan dan Mesin" },
  { value: "C", label: `${LABEL_JENIS_KIB.C.pendek} — ${LABEL_JENIS_KIB.C.label}` },
  { value: "D", label: `${LABEL_JENIS_KIB.D.pendek} — ${LABEL_JENIS_KIB.D.label}` },
  { value: "E", label: `${LABEL_JENIS_KIB.E.pendek} — ${LABEL_JENIS_KIB.E.label}` },
  { value: "F", label: `${LABEL_JENIS_KIB.F.pendek} — ${LABEL_JENIS_KIB.F.label}` },
];

export function LaporanManager({
  kategoriList,
  ruanganList,
  usulanNihil,
}: {
  kategoriList: KategoriAset[];
  ruanganList: Ruangan[];
  usulanNihil: boolean;
}) {
  const [kategoriId, setKategoriId] = useState("");
  const [ruanganId, setRuanganId] = useState("");
  const [tahunMutasi, setTahunMutasi] = useState("");
  const [jenisKib, setJenisKib] = useState<string>("A");
  const [modeKategori, setModeKategori] = useState(true);

  function bukaCetak(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Buku Inventaris — rekap semua aset lintas kategori */}
      <div className="tag-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-pine-soft flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-pine" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm">
              Buku Inventaris
            </p>
            <p className="text-[12px] text-ink-soft">
              Rekap semua aset, lintas kategori & ruangan
            </p>
          </div>
        </div>

        <p className="text-[12px] text-ink-soft">
          Satu daftar lengkap seluruh aset sekolah, sesuai format Buku
          Inventaris dinas.
        </p>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() => bukaCetak("/cetak/laporan/buku-inventaris")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href="/api/laporan/export/buku-inventaris"
            className="inline-flex items-center justify-center gap-1.5 border border-line text-ink-soft text-sm font-medium px-3 py-2 rounded-lg hover:bg-paper transition-colors"
            title="Export ke Excel"
          >
            <FileSpreadsheet size={15} />
          </a>
        </div>
      </div>

      {/* KIB — Kartu Inventaris Barang. Toggle nentuin dropdown-nya
          berdasar Kategori (KIB B, per kategori barang) atau berdasar
          Jenis KIB A/C/D/E/F (aset tetap khusus). */}
      <div className="tag-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-pine-soft flex items-center justify-center shrink-0">
            <FileBarChart size={18} className="text-pine" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm">KIB</p>
            <p className="text-[12px] text-ink-soft">Kartu Inventaris Barang</p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={modeKategori}
              onChange={(e) => setModeKategori(e.target.checked)}
              className="w-4 h-4 rounded border-line accent-pine"
            />
            <span className="text-[12px] text-ink-soft">
              {modeKategori
                ? "Berdasar Kategori Barang"
                : "Berdasar Jenis (KIB A–F)"}
            </span>
          </label>

          {modeKategori ? (
            <Select
              size="sm"
              value={kategoriId}
              onChange={setKategoriId}
              options={[
                { value: "", label: "Semua Kategori (Peralatan dan Mesin)" },
                ...kategoriList
                  .filter((k) => !k.kode_kib || k.kode_kib === "B")
                  .map((k) => ({ value: k.id, label: k.nama })),
              ]}
            />
          ) : (
            <Select
              size="sm"
              value={jenisKib}
              onChange={setJenisKib}
              options={OPSI_JENIS_KIB}
            />
          )}
        </div>

        {modeKategori && (
          <p className="text-[11px] text-ink-soft -mt-2">
            Cuma nampilin kategori bertanda{" "}
            <span className="font-medium text-ink">KIB B</span> atau belum
            ditandai — kategori KIB lain (mis. Buku) punya laporan sendiri.
          </p>
        )}

        {!modeKategori && (
          <p className="text-[11px] text-ink-soft -mt-2">
            {jenisKib === "B" ? (
              <>
                Datanya dikelola di menu{" "}
                <span className="font-medium text-ink">Data Aset</span>.
              </>
            ) : (
              <>
                Datanya dikelola di menu{" "}
                <span className="font-medium text-ink">Aset Tetap Khusus</span>.
              </>
            )}
          </p>
        )}

        <div className="mt-auto flex gap-2">
          <button
            onClick={() =>
              bukaCetak(
                modeKategori
                  ? `/cetak/laporan/kib${kategoriId ? `?kategori=${kategoriId}` : ""}`
                  : jenisKib === "B"
                  ? "/cetak/laporan/kib"
                  : `/cetak/laporan/kib-tetap/${jenisKib}`
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href={
              modeKategori
                ? `/api/laporan/export/kib${kategoriId ? `?kategori=${kategoriId}` : ""}`
                : jenisKib === "B"
                ? "/api/laporan/export/kib"
                : `/api/laporan/export/kib-tetap/${jenisKib}`
            }
            className="inline-flex items-center justify-center gap-1.5 border border-line text-ink-soft text-sm font-medium px-3 py-2 rounded-lg hover:bg-paper transition-colors"
            title="Export ke Excel"
          >
            <FileSpreadsheet size={15} />
          </a>
        </div>
      </div>

      {/* KIR — Kartu Inventaris Ruangan, per ruangan */}
      <div className="tag-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brass-soft flex items-center justify-center shrink-0">
            <FileBarChart size={18} className="text-brass" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm">KIR</p>
            <p className="text-[12px] text-ink-soft">Kartu Inventaris Ruangan</p>
          </div>
        </div>

        <div>
          <label className="text-[12px] text-ink-soft mb-1 block">
            Ruangan
          </label>
          <Select
            size="sm"
            value={ruanganId}
            onChange={setRuanganId}
            options={[
              { value: "", label: "Semua Ruangan" },
              ...ruanganList.map((r) => ({ value: r.id, label: r.nama })),
            ]}
          />
        </div>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() =>
              bukaCetak(
                `/cetak/laporan/kir${ruanganId ? `?ruangan=${ruanganId}` : ""}`
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href={`/api/laporan/export/kir${ruanganId ? `?ruangan=${ruanganId}` : ""}`}
            className="inline-flex items-center justify-center gap-1.5 border border-line text-ink-soft text-sm font-medium px-3 py-2 rounded-lg hover:bg-paper transition-colors"
            title="Export ke Excel"
          >
            <FileSpreadsheet size={15} />
          </a>
        </div>
      </div>

      {/* Laporan Mutasi, per tahun */}
      <div className="tag-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sage-soft flex items-center justify-center shrink-0">
            <ArrowLeftRight size={18} className="text-sage" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm">
              Laporan Mutasi
            </p>
            <p className="text-[12px] text-ink-soft">
              Riwayat perpindahan aset antar ruangan
            </p>
          </div>
        </div>

        <div>
          <label className="text-[12px] text-ink-soft mb-1 block">Tahun</label>
          <Select
            size="sm"
            value={tahunMutasi}
            onChange={setTahunMutasi}
            options={[
              { value: "", label: "Semua Tahun" },
              ...OPSI_TAHUN.map((t) => ({ value: String(t), label: String(t) })),
            ]}
          />
        </div>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() =>
              bukaCetak(
                `/cetak/laporan/mutasi${tahunMutasi ? `?tahun=${tahunMutasi}` : ""}`
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href={`/api/laporan/export/mutasi${tahunMutasi ? `?tahun=${tahunMutasi}` : ""}`}
            className="inline-flex items-center justify-center gap-1.5 border border-line text-ink-soft text-sm font-medium px-3 py-2 rounded-lg hover:bg-paper transition-colors"
            title="Export ke Excel"
          >
            <FileSpreadsheet size={15} />
          </a>
        </div>
      </div>

      {/* Daftar Usulan Barang yang Dihapus — otomatis dari aset Rusak Berat */}
      <div className="tag-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brick-soft flex items-center justify-center shrink-0">
            <FileX2 size={18} className="text-brick" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-sm">
              Daftar Usulan Penghapusan
            </p>
            <p className="text-[12px] text-ink-soft">
              Otomatis dari aset kondisi Rusak Berat
            </p>
          </div>
        </div>

        <p className="text-[12px] text-ink-soft">
          {usulanNihil ? (
            <>
              Ditandai <span className="font-medium text-ink">NIHIL</span> —
              ubah di Pengaturan kalau mau tampilkan data.
            </>
          ) : (
            "Ubah ke NIHIL kapan aja lewat Pengaturan."
          )}
        </p>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() => bukaCetak("/cetak/laporan/daftar-usulan")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href="/api/laporan/export/daftar-usulan"
            className="inline-flex items-center justify-center gap-1.5 border border-line text-ink-soft text-sm font-medium px-3 py-2 rounded-lg hover:bg-paper transition-colors"
            title="Export ke Excel"
          >
            <FileSpreadsheet size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
