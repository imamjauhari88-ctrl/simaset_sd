"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TrenBulananItem } from "@/lib/supabase/queries";

export function TrenChart({ data }: { data: TrenBulananItem[] }) {
  // useId() bikin id unik per-instance komponen (mis. "«r1»" dari React),
  // bukan string tetap "trenFill" — jadi kalau TrenChart nanti dipakai
  // berulang di satu halaman yang sama, tiap instance punya <linearGradient>
  // sendiri-sendiri, gak rebutan id yang sama di DOM (yang bisa bikin
  // gradient-nya salah ke-reference/kacau).
  const gradientId = `trenFill-${useId()}`;

  return (
    <div className="tag-card p-5 h-full">
      <p className="font-display font-semibold text-ink mb-4">
        Penambahan Aset — 6 Bulan Terakhir
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-pine)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-pine)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" stroke="var(--color-line)" />
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
            width={32}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="jumlah"
            stroke="var(--color-pine)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
