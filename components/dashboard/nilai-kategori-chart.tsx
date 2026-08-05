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
  // Tinggi mengikuti jumlah kategori biar tiap bar dapat ruang yang layak,
  // bukan diperas jadi satu tinggi tetap kayak chart lain.
  const tinggi = Math.max(180, data.length * 40);

  return (
    <div className="tag-card p-5 h-full">
      <p className="font-display font-semibold text-ink mb-4">
        Nilai Aset per Kategori
      </p>
      {kosong ? (
        <div className="h-[180px] flex items-center justify-center text-[13px] text-ink-soft">
          Belum ada data aset
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={tinggi}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
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
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
