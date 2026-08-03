import { Boxes } from "lucide-react";

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-pine-dark)] via-[var(--color-pine)] to-[var(--color-pine-dark)] px-6 py-8 sm:px-10 sm:py-10">
      {/* Motif grid tipis di background, senada nuansa "kartu inventaris" */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow halus di kanan atas */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          <Boxes size={13} strokeWidth={2.25} />
          Sistem Manajemen Aset Sekolah
        </span>

        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
          Selamat Datang!
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          Pantau, kelola, dan dokumentasikan seluruh barang inventaris
          sekolah secara efisien dan terstruktur.
        </p>
      </div>
    </div>
  );
}
