"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { JumlahPerKategoriItem } from "@/lib/supabase/queries";

export function JumlahKategoriChart({ data }: { data: JumlahPerKategoriItem[] }) {
  const kosong = data.length === 0;
  const total = data.reduce((sum, d) => sum + d.jumlah, 0);

  return (
    <div className="tag-card p-5 h-full">
      <p className="font-display font-semibold text-ink mb-1">
        Jumlah Aset per Kategori
      </p>
      <p className="text-[13px] text-ink-soft mb-4">Distribusi aset</p>

      {kosong ? (
        <div className="h-[160px] flex items-center justify-center text-[13px] text-ink-soft">
          Belum ada data aset
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="shrink-0" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="jumlah"
                  nameKey="kategori"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.kategori} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${new Intl.NumberFormat("id-ID").format(value)} unit`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex-1 min-w-0 space-y-2.5">
            {data.map((entry) => (
              <li
                key={entry.kategori}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex items-center gap-2 min-w-0 text-ink-soft">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate">{entry.kategori}</span>
                </span>
                <span className="font-medium text-ink shrink-0">
                  {new Intl.NumberFormat("id-ID").format(entry.jumlah)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!kosong && (
        <p className="text-[12px] text-ink-soft mt-4 pt-3 border-t border-line">
          Total {new Intl.NumberFormat("id-ID").format(total)} aset tercatat
        </p>
      )}
    </div>
  );
}
