"use client";

import { useState } from "react";
import { FileBarChart, ArrowLeftRight, Printer } from "lucide-react";
import type { KategoriAset, Ruangan } from "@/types/database";
import { daftarTahunOpsi } from "@/lib/format";

const OPSI_TAHUN = daftarTahunOpsi();

export function LaporanManager({
  kategoriList,
  ruanganList,
}: {
  kategoriList: KategoriAset[];
  ruanganList: Ruangan[];
}) {
  const [kategoriId, setKategoriId] = useState("");
  const [ruanganId, setRuanganId] = useState("");
  const [tahunMutasi, setTahunMutasi] = useState("");

  function bukaCetak(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* KIB — Kartu Inventaris Barang, per kategori */}
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
          <label className="text-[12px] text-ink-soft mb-1 block">
            Kategori Barang
          </label>
          <select
            value={kategoriId}
            onChange={(e) => setKategoriId(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink outline-none focus:border-pine transition-colors"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            bukaCetak(
              `/cetak/laporan/kib${kategoriId ? `?kategori=${kategoriId}` : ""}`
            )
          }
          className="mt-auto inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
        >
          <Printer size={15} />
          Cetak KIB
        </button>
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
          <select
            value={ruanganId}
            onChange={(e) => setRuanganId(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink outline-none focus:border-pine transition-colors"
          >
            <option value="">Semua Ruangan</option>
            {ruanganList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            bukaCetak(
              `/cetak/laporan/kir${ruanganId ? `?ruangan=${ruanganId}` : ""}`
            )
          }
          className="mt-auto inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
        >
          <Printer size={15} />
          Cetak KIR
        </button>
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
          <select
            value={tahunMutasi}
            onChange={(e) => setTahunMutasi(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink outline-none focus:border-pine transition-colors"
          >
            <option value="">Semua Tahun</option>
            {OPSI_TAHUN.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            bukaCetak(
              `/cetak/laporan/mutasi${tahunMutasi ? `?tahun=${tahunMutasi}` : ""}`
            )
          }
          className="mt-auto inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
        >
          <Printer size={15} />
          Cetak Laporan Mutasi
        </button>
      </div>
    </div>
  );
}
