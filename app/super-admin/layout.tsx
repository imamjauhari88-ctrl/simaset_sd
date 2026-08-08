import { ShieldCheck } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Footer } from "@/components/layout/footer";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-display font-semibold text-ink text-[14px]">
                Super Admin
              </p>
              <p className="text-[10px] text-ink-soft -mt-0.5">
                SIMASET SD — Panel Developer
              </p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-[13px] text-ink-soft hover:text-ink"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
