"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/sekolah", label: "Data Sekolah" },
  { href: "/super-admin/aset", label: "Aset Global" },
  { href: "/super-admin/user", label: "User Global" },
  { href: "/super-admin/analitik", label: "Analitik" },
];

export function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {TABS.map((t) => {
        const aktif =
          t.href === "/super-admin"
            ? pathname === "/super-admin"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors",
              aktif
                ? "bg-pine text-white"
                : "text-ink-soft hover:bg-paper hover:text-ink"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
