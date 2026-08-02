import clsx from "clsx";
import type { KondisiAset } from "@/types/database";

const config: Record<KondisiAset, { label: string; className: string }> = {
  baik: { label: "Baik", className: "bg-sage-soft text-sage" },
  rusak_ringan: { label: "Rusak Ringan", className: "bg-brass-soft text-brass" },
  rusak_berat: { label: "Rusak Berat", className: "bg-brick-soft text-brick" },
};

export function KondisiBadge({ kondisi }: { kondisi: KondisiAset }) {
  const { label, className } = config[kondisi];
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
