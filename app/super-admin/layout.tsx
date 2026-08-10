import { ShieldCheck } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { SuperAdminNav } from "@/components/super-admin/super-admin-nav";
import { TombolKeluarSuperAdmin } from "@/components/super-admin/tombol-keluar-super-admin";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pine text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-ink text-[14px] truncate">
                Super Admin
              </p>
              <p className="text-[10px] text-ink-soft -mt-0.5 truncate">
                SIMASET SD — Panel Developer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <SuperAdminNav
              keluarSlot={<TombolKeluarSuperAdmin />}
            />
            <div className="hidden md:block">
              <TombolKeluarSuperAdmin />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
