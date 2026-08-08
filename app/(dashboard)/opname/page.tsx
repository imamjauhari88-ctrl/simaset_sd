import Link from "next/link";
import { History } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { OpnameManager } from "@/components/opname/opname-manager";
import { createClient } from "@/lib/supabase/server";
import { getProfilSaya } from "@/lib/tenant/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";

function TombolRiwayat() {
  return (
    <Link
      href="/opname/riwayat"
      className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit mb-4"
    >
      <History size={16} />
      Riwayat Opname
    </Link>
  );
}

export default async function OpnamePage() {
  const profil = await getProfilSaya();

  if (profil && profil.role !== "admin") {
    return (
      <>
        <Topbar title="Opname Fisik" />
        <main className="flex-1 p-6">
          <TombolRiwayat />
          <EmptyState
            icon={ClipboardCheck}
            title="Khusus Admin"
            description="Opname fisik (mulai sesi & scan QR) cuma bisa dilakukan admin. Hubungi admin sekolahmu kalau perlu opname baru — hasil opname yang sudah selesai tetap bisa kamu lihat lewat Riwayat Opname."
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
        <TombolRiwayat />
        <OpnameManager sesiAwal={sesiAktif} />
      </main>
    </>
  );
}
