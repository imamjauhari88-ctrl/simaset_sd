"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { PenggunaanFiturItem } from "@/app/super-admin/actions";

/* Palet warna kategori yang sama dipakai di dashboard sekolah (lib/supabase/queries.ts,
 * WARNA_KATEGORI) — dipakai lagi di sini biar tiap batang fitur kebeda warna, senada
 * dengan chart lain (mis. Kondisi Aset) bukan warna brass tunggal yang monoton. */
const WARNA_FITUR = [
  "var(--color-pine)",
  "var(--color-brass)",
  "var(--color-sage)",
  "var(--color-brick)",
  "var(--color-pine-dark)",
  "#8a6fb3",
  "#4f7ea8",
  "#c97f3c",
];

export function GrafikPenggunaanFitur({ data }: { data: PenggunaanFiturItem[] }) {
  const kosong = data.every((d) => d.jumlah30HariTerakhir === 0);

  if (kosong) {
    return (
      <div className="h-[160px] flex items-center justify-center text-[13px] text-ink-soft">
        Belum ada aktivitas tercatat dalam 30 hari terakhir.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
        />
        <YAxis
          type="category"
          dataKey="fitur"
          tickLine={false}
          axisLine={false}
          width={110}
          tick={{ fontSize: 12, fill: "var(--color-ink)" }}
        />
        <Tooltip
          formatter={(value: number) => [`${value} data baru`, "30 hari terakhir"]}
          cursor={{ fill: "var(--color-paper)" }}
        />
        <Bar dataKey="jumlah30HariTerakhir" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((entry, i) => (
            <Cell key={entry.fitur} fill={WARNA_FITUR[i % WARNA_FITUR.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
