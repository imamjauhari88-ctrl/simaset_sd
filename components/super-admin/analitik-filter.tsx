"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Download } from "lucide-react";
import { GrafikPenggunaanFitur } from "@/components/super-admin/grafik-penggunaan-fitur";
import { formatRupiah, formatAngka } from "@/lib/format";
import {
  getLaporanPenggunaanFitur,
  getLaporanAsetRingkas,
  type PenggunaanFiturItem,
  type LaporanAsetRingkas,
} from "@/app/super-admin/actions";

export function AnalitikFilter({
  penggunaanFiturAwal,
  laporanAsetAwal,
  opsiSekolah,
}: {
  penggunaanFiturAwal: PenggunaanFiturItem[];
  laporanAsetAwal: LaporanAsetRingkas;
  opsiSekolah: { id: string; nama: string }[];
}) {
  const [sekolahId, setSekolahId] = useState("");
  const [penggunaanFitur, setPenggunaanFitur] = useState(penggunaanFiturAwal);
  const [laporanAset, setLaporanAset] = useState(laporanAsetAwal);
  const [loading, setLoading] = useState(false);

  // Data awal ("semua sekolah") udah dikirim dari server component —
  // baru fetch ulang begitu filter sekolah diganti.
  const pertamaKali = useRef(true);

  useEffect(() => {
    if (pertamaKali.current) {
      pertamaKali.current = false;
      return;
    }
    let batal = false;
    setLoading(true);
    Promise.all([
      getLaporanPenggunaanFitur(sekolahId || undefined),
      getLaporanAsetRingkas(sekolahId || undefined),
    ])
      .then(([fitur, aset]) => {
        if (batal) return;
        setPenggunaanFitur(fitur);
        setLaporanAset(aset);
      })
      .finally(() => {
        if (!batal) setLoading(false);
      });
    return () => {
      batal = true;
    };
  }, [sekolahId]);

  const namaSekolahTerpilih = opsiSekolah.find((s) => s.id === sekolahId)?.nama;
  const urlExport = sekolahId
    ? `/api/super-admin/export/ringkasan?sekolahId=${sekolahId}`
    : "/api/super-admin/export/ringkasan";

  return (
    <div className="space-y-6">
      <div className="tag-card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-2 text-sm text-ink flex-1 sm:max-w-xs">
          <Building2 size={15} className="text-ink-soft shrink-0" />
          <select
            value={sekolahId}
            onChange={(e) => setSekolahId(e.target.value)}
            className="bg-transparent outline-none w-full text-ink"
          >
            <option value="">Semua sekolah</option>
            {opsiSekolah.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>

        <a
          href={urlExport}
          className="inline-flex items-center justify-center gap-1.5 bg-pine text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-pine-dark transition-colors w-fit shrink-0 sm:ml-auto"
        >
          <Download size={15} />
          Export {sekolahId ? "Ringkasan Sekolah Ini" : "Ringkasan Sekolah"} (Excel)
        </a>
      </div>

      <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <div className="tag-card p-5">
          <p className="font-display font-semibold text-ink mb-1">
            Penggunaan Fitur
          </p>
          <p className="text-[13px] text-ink-soft mb-4">
            Jumlah data baru per modul dalam 30 hari terakhir
            {namaSekolahTerpilih ? ` di ${namaSekolahTerpilih}` : ", lintas semua sekolah"}{" "}
            — proxy paling deket buat &quot;fitur mana yang paling sering
            dipakai&quot; (sistem ini belum punya event tracking klik per
            fitur).
          </p>
          <GrafikPenggunaanFitur data={penggunaanFitur} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="tag-card p-5">
            <p className="font-display font-semibold text-ink mb-1">
              Total Nilai Aset
            </p>
            <p className="text-[13px] text-ink-soft mb-3">
              Jumlah harga perolehan
              {namaSekolahTerpilih ? ` aset di ${namaSekolahTerpilih}` : " semua aset, semua sekolah"}
            </p>
            <p className="font-display text-2xl font-semibold text-ink">
              {formatRupiah(laporanAset.totalNilaiAset)}
            </p>
          </div>

          <div className="tag-card p-5">
            <p className="font-display font-semibold text-ink mb-3">
              Kategori Aset Terpopuler
            </p>
            {laporanAset.kategoriTerpopuler.length === 0 ? (
              <p className="text-[13px] text-ink-soft">Belum ada data aset.</p>
            ) : (
              <ul className="space-y-2">
                {laporanAset.kategoriTerpopuler.map((k) => (
                  <li key={k.nama} className="flex items-center gap-3">
                    <span className="text-[13px] text-ink flex-1 truncate">{k.nama}</span>
                    <span className="text-[12px] font-medium text-pine bg-pine-soft px-2 py-0.5 rounded-full shrink-0">
                      {formatAngka(k.jumlah)} unit
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
