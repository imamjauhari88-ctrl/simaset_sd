import { Topbar } from "@/components/layout/topbar";
import { OpnameManager } from "@/components/opname/opname-manager";
import { createClient } from "@/lib/supabase/server";
import { getProfilSaya } from "@/lib/tenant/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";

export default async function OpnamePage() {
  const profil = await getProfilSaya();

  if (profil && profil.role !== "admin") {
    return (
      <>
        <Topbar title="Opname Fisik" />
        <main className="flex-1 p-6">
          <EmptyState
            icon={ClipboardCheck}
            title="Khusus Admin"
            description="Opname fisik (mulai sesi & scan QR) cuma bisa dilakukan admin. Hubungi admin sekolahmu kalau perlu opname baru."
          />
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const { data: sesiAktif } = await supabase
    .from("opname_sesi")
    .select("*")
    .eq("status", "berlangsung")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Topbar title="Opname Fisik" />
      <main className="flex-1 p-6">
        <OpnameManager sesiAwal={sesiAktif} />
      </main>
    </>
  );
}
