"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { KondisiBreakdownItem } from "@/lib/supabase/queries";

export function KondisiChart({ data }: { data: KondisiBreakdownItem[] }) {
  const totalKosong = data.every((d) => d.value === 0);

  return (
    <div className="tag-card p-5 h-full">
      <p className="font-display font-semibold text-ink mb-4">
        Kondisi Aset
      </p>
      {totalKosong ? (
        <div className="h-[220px] flex items-center justify-center text-[13px] text-ink-soft">
          Belum ada data aset
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "var(--color-ink-soft)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
