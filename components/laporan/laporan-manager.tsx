"use client";

import { useState } from "react";
import { FileBarChart, ArrowLeftRight, Printer, FileSpreadsheet } from "lucide-react";
import type { KategoriAset, Ruangan } from "@/types/database";
import { daftarTahunOpsi } from "@/lib/format";
import { Select } from "@/components/ui/select";

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
          <Select
            size="sm"
            value={kategoriId}
            onChange={setKategoriId}
            options={[
              { value: "", label: "Semua Kategori" },
              ...kategoriList.map((k) => ({ value: k.id, label: k.nama })),
            ]}
          />
        </div>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() =>
              bukaCetak(
                `/cetak/laporan/kib${kategoriId ? `?kategori=${kategoriId}` : ""}`
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Printer size={15} />
            Cetak
          </button>
          <a
            href={`/api/laporan/export/kib${kategoriId ? `?kategori=${kategoriId}` : ""}`}
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
    </div>
  );
}
