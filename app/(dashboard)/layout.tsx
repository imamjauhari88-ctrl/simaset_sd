import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Footer } from "@/components/layout/footer";
import { PengumumanBanner } from "@/components/layout/pengumuman-banner";
import { getPengumumanAktif } from "@/lib/supabase/queries";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pengumuman = await getPengumumanAktif();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <PengumumanBanner data={pengumuman} />
          {children}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
