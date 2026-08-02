import { Search } from "lucide-react";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { SidebarToggleButton } from "./sidebar-toggle-button";
import { NotifikasiDropdown } from "./notifikasi-dropdown";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

export async function Topbar({ title }: { title: string }) {
  const [profil, sekolah] = await Promise.all([
    getProfilSaya(),
    getSekolahSaya(),
  ]);

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b border-line bg-surface flex items-center justify-between px-4 sm:px-6 gap-3"
      style={{ height: "4rem", minHeight: "4rem" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <SidebarToggleButton />
        <div className="min-w-0 leading-tight">
          {sekolah && (
            <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider truncate">
              {sekolah.nama}
            </p>
          )}
          <h1 className="font-display font-semibold text-lg text-ink truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden lg:flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-1.5 text-sm text-ink-soft w-64 focus-within:border-pine transition-colors">
          <Search size={16} />
          <input
            placeholder="Cari kode / nama aset..."
            className="bg-transparent outline-none w-full placeholder:text-ink-soft"
          />
        </div>

        <NotifikasiDropdown />
        <ThemeToggle />

        {profil && <UserMenu nama={profil.nama} role={profil.role} />}
      </div>
    </header>
  );
}
