import Link from "next/link";
import { Boxes, type LucideIcon } from "lucide-react";

/**
 * Panel warna dekoratif buat sisi Login/Onboarding — gaya & motifnya
 * (gradient pine + grid tipis + glow blur) sengaja disamain persis sama
 * WelcomeBanner di Dashboard, biar identitas visual "SIMASET SD" itu
 * konsisten dari halaman pertama kali dibuka (login) sampai ke dalam app.
 */
export function PanelBrand({
  title,
  description,
  linkHref,
  linkLabel,
  icon: Icon = Boxes,
}: {
  title: string;
  description: string;
  /** Opsional — beberapa kondisi (mis. user udah login tapi belum
   * terhubung ke sekolah) gak punya "flow lain" yang relevan buat
   * ditawarin, jadi tombolnya boleh disembunyikan. */
  linkHref?: string;
  linkLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-pine-dark)] via-[var(--color-pine)] to-[var(--color-pine-dark)] px-8 py-10 flex flex-col items-center justify-center text-center min-h-[220px] h-full">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="rounded-full bg-white/10 p-3 mb-4 backdrop-blur-sm">
          <Icon size={22} className="text-white" strokeWidth={2} />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 max-w-xs text-sm text-white/75">{description}</p>
        {linkHref && linkLabel && (
          <Link
            href={linkHref}
            className="mt-6 inline-flex items-center justify-center border border-white/40 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
