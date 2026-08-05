"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { NilaiPerKategoriItem } from "@/lib/supabase/queries";
import { formatRupiah } from "@/lib/format";

/** Format ringkas buat sumbu-X (mis. "Rp 4,2 jt") — formatRupiah penuh
 * dipakai di tooltip aja, kepanjangan buat label sumbu. */
function formatSingkat(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return formatRupiah(n);
}

export function NilaiKategoriChart({ data }: { data: NilaiPerKategoriItem[] }) {
  const kosong = data.length === 0;
  // Tinggi per baris dipas-in sama ukuran batang (barSize 20 + jarak
  // antar-batang 12px) — bukan tebakan longgar kayak sebelumnya (40px
  // buat batang 18px), yang bikin banyak ruang kosong kalau kategorinya
  // dikit. barCategoryGap dikunci eksplisit (bukan persentase default
  // recharts) biar jaraknya konsisten walau container-nya ikut menyempit
  // di layar kecil.
  const TINGGI_BARIS = 32;
  const tinggi = Math.max(120, data.length * TINGGI_BARIS + 24);

  return (
    <div className="tag-card p-5">
      <p className="font-display font-semibold text-ink mb-4">
        Nilai Aset per Kategori
      </p>
      {kosong ? (
        <div className="h-[120px] flex items-center justify-center text-[13px] text-ink-soft">
          Belum ada data aset
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={tinggi}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
            barCategoryGap={12}
          >
            <CartesianGrid horizontal={false} stroke="var(--color-line)" />
            <XAxis
              type="number"
              tickFormatter={formatSingkat}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
            />
            <YAxis
              type="category"
              dataKey="kategori"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            />
            <Tooltip
              formatter={(value: number) => formatRupiah(value)}
              cursor={{ fill: "var(--color-paper)" }}
            />
            <Bar
              dataKey="nilai"
              fill="var(--color-brass)"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
