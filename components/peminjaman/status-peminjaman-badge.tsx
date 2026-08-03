import clsx from "clsx";
import type { StatusPeminjaman } from "@/types/database";

const config: Record<StatusPeminjaman, { label: string; className: string }> = {
  MENUNGGU: { label: "Menunggu", className: "bg-brass-soft text-brass" },
  DIPINJAM: { label: "Dipinjam", className: "bg-pine-soft text-pine" },
  DITOLAK: { label: "Ditolak", className: "bg-brick-soft text-brick" },
  DIKEMBALIKAN: { label: "Dikembalikan", className: "bg-sage-soft text-sage" },
};

export function StatusPeminjamanBadge({
  status,
  terlambat,
}: {
  status: StatusPeminjaman;
  terlambat?: boolean;
}) {
  // "Terlambat" ditumpuk di atas badge status DIPINJAM (bukan status
  // terpisah) karena memang dihitung on-the-fly, bukan status tersimpan.
  if (status === "DIPINJAM" && terlambat) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-brick-soft text-brick">
        Terlambat
      </span>
    );
  }
  const { label, className } = config[status];
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
