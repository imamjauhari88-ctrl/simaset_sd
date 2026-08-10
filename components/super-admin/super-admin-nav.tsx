"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/sekolah", label: "Data Sekolah" },
  { href: "/super-admin/aset", label: "Aset Global" },
  { href: "/super-admin/user", label: "User Global" },
  { href: "/super-admin/analitik", label: "Analitik" },
];

function isAktif(pathname: string | null, href: string) {
  return href === "/super-admin"
    ? pathname === "/super-admin"
    : (pathname?.startsWith(href) ?? false);
}

export function SuperAdminNav({
  keluarSlot,
}: {
  keluarSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: tab horizontal seperti sebelumnya */}
      <nav className="hidden md:flex items-center gap-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors",
              isAktif(pathname, t.href)
                ? "bg-pine text-white"
                : "text-ink-soft hover:bg-paper hover:text-ink"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: tombol hamburger, nav-nya dibuka lewat drawer */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden text-ink-soft hover:text-ink p-1.5 rounded-lg hover:bg-paper transition-colors"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface flex flex-col shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-line shrink-0">
              <div className="leading-tight">
                <p className="font-display font-semibold text-ink text-[14px]">
                  Super Admin
                </p>
                <p className="text-[10px] text-ink-soft -mt-0.5">
                  SIMASET SD — Panel Developer
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-ink-soft hover:text-ink p-1"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "block px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                    isAktif(pathname, t.href)
                      ? "bg-pine-soft text-pine-dark font-medium"
                      : "text-ink-soft hover:bg-paper hover:text-ink"
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            <div className="p-3 border-t border-line tag-dashed-top shrink-0">
              {keluarSlot}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
