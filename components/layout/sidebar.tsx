"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  LayoutDashboard,
  Boxes,
  Tags,
  DoorOpen,
  ArrowLeftRight,
  HandCoins,
  Wrench,
  ClipboardCheck,
  FileBarChart,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useSidebar } from "./sidebar-context";
import { TombolKeluarSidebar } from "./tombol-keluar-sidebar";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/aset", label: "Data Aset", icon: Boxes },
  { href: "/kategori", label: "Kategori Barang", icon: Tags },
  { href: "/ruangan", label: "Ruangan / Lokasi", icon: DoorOpen },
  { href: "/mutasi", label: "Mutasi Aset", icon: ArrowLeftRight },
  { href: "/peminjaman", label: "Peminjaman", icon: HandCoins },
  { href: "/pemeliharaan", label: "Pemeliharaan", icon: Wrench },
  { href: "/opname", label: "Opname Fisik", icon: ClipboardCheck },
  { href: "/laporan", label: "Laporan", icon: FileBarChart },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" className="shrink-0">
      {/* Kotak inventaris isometrik — merepresentasikan aset & barang sekolah */}
      <path d="M13 1.5L23.5 7.25V18.75L13 24.5L2.5 18.75V7.25L13 1.5Z" fill="var(--color-pine-soft)" />
      <path d="M13 1.5L23.5 7.25L13 13L2.5 7.25L13 1.5Z" fill="var(--color-pine)" />
      <path d="M13 13L23.5 7.25V18.75L13 24.5V13Z" fill="var(--color-pine-dark)" />
      <path d="M13 13L2.5 7.25V18.75L13 24.5V13Z" fill="var(--color-pine)" fillOpacity="0.8" />
      <path d="M8 4.6L18.5 10.35" stroke="var(--color-paper)" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
    </svg>
  );
}

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  if (collapsed) {
    // Rail icon-only: tiap item jadi kotak 44x44 ditengah, tooltip native
    // (title) gantiin label yang disembunyikan biar tetap jelas fungsinya.
    return (
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col items-center gap-1">
        {menu.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={clsx(
                "flex items-center justify-center w-11 h-11 rounded-xl transition-colors",
                active
                  ? "bg-pine-soft text-pine-dark"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.25 : 1.75} />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {menu.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all",
              active
                ? "bg-pine-soft text-pine-dark font-medium shadow-[inset_2px_0_0_var(--color-pine)]"
                : "text-ink-soft hover:bg-paper hover:text-ink hover:translate-x-0.5"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { isMobileOpen, isDesktopOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop: bisa ditutup/dibuka lewat tombol burger di Topbar.
          "Tertutup" di desktop BUKAN hilang total (beda dari mobile) —
          tetap tampil sebagai rail sempit isi ikon aja (72px), biar
          navigasi & tombol keluar tetap kejangkau tanpa buka sidebar. */}
      <aside
        className={clsx(
          "hidden md:flex shrink-0 flex-col h-full border-r border-line bg-surface transition-[width] duration-200 ease-in-out overflow-hidden",
          isDesktopOpen ? "w-64" : "w-[72px]"
        )}
      >
        <div
          className={clsx(
            "flex items-center h-16 border-b border-line",
            isDesktopOpen ? "gap-3 px-5" : "justify-center px-2"
          )}
          style={{ height: "4rem", minHeight: "4rem" }}
        >
          <LogoMark />
          {isDesktopOpen && (
            <div className="leading-tight">
              <p className="font-display font-semibold text-ink text-[15px]">
                SIMASET SD
              </p>
              <p className="text-[11px] text-ink-soft">Inventaris Aset Sekolah</p>
            </div>
          )}
        </div>
        <NavLinks collapsed={!isDesktopOpen} />
        <div
          className={clsx(
            "border-t border-line tag-dashed-top",
            isDesktopOpen ? "p-3" : "p-2.5 flex justify-center"
          )}
        >
          <TombolKeluarSidebar collapsed={!isDesktopOpen} />
        </div>
      </aside>

      {/* Mobile: drawer + backdrop, cuma render saat dibuka */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={closeMobile}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface flex flex-col shadow-xl animate-slide-in-left">
            <div
              className="flex items-center justify-between gap-3 px-5 h-16 border-b border-line"
              style={{ height: "4rem", minHeight: "4rem" }}
            >
              <div className="flex items-center gap-3">
                <LogoMark />
                <div className="leading-tight">
                  <p className="font-display font-semibold text-ink text-[15px]">
                    SIMASET SD
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Inventaris Aset Sekolah
                  </p>
                </div>
              </div>
              <button
                onClick={closeMobile}
                className="text-ink-soft hover:text-ink p-1"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={closeMobile} />
            <div className="p-3 border-t border-line tag-dashed-top">
              <TombolKeluarSidebar />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
