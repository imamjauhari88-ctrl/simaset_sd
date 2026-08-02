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
import type { TrenBulananItem } from "@/lib/supabase/queries";

export function TrenChart({ data }: { data: TrenBulananItem[] }) {
  return (
    <div className="tag-card p-5 h-full">
      <p className="font-display font-semibold text-ink mb-4">
        Penambahan Aset — 6 Bulan Terakhir
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="bulan"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            width={28}
          />
          <Tooltip />
          <Bar dataKey="jumlah" fill="var(--color-pine)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
