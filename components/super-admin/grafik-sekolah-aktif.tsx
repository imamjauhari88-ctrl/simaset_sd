"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity } from "lucide-react";

export function GrafikSekolahAktif({
  data,
}: {
  data: { nama: string; jumlahAsetBulanIni: number }[];
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Belum ada aset diupload bulan ini"
        description="Grafik bakal muncul begitu ada sekolah yang nambah aset."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
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
          dataKey="nama"
          tickLine={false}
          axisLine={false}
          width={140}
          tick={{ fontSize: 12, fill: "var(--color-ink)" }}
        />
        <Tooltip
          formatter={(value: number) => [`${value} aset`, "Diupload bulan ini"]}
          cursor={{ fill: "var(--color-paper)" }}
        />
        <Bar dataKey="jumlahAsetBulanIni" fill="var(--color-pine)" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
