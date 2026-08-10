import Link from "next/link";
import { Plus, QrCode, Layers } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { TabelAset } from "@/components/aset/tabel-aset";
import { getDaftarAsetPaginated, getTotalAset } from "@/lib/supabase/queries";
import { getProfilSaya } from "@/lib/tenant/context";
import type { KondisiAset } from "@/types/database";
import { Boxes } from "lucide-react";

const PAGE_SIZE = 15;

export default async function AsetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; kondisi?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.q ?? "";
  const kondisi = (sp.kondisi ?? "semua") as KondisiAset | "semua";

  const [daftarAsetHalamanIni, totalAset, profil] = await Promise.all([
    getDaftarAsetPaginated({ page, pageSize: PAGE_SIZE, search, kondisi }),
    getTotalAset(),
    getProfilSaya(),
  ]);
  const bisaTambah = profil?.role === "admin" || profil?.role === "guru";

  return (
    <>
      <Topbar title="Data Aset" />
      <main className="flex-1 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[13px] text-ink-soft">
            {totalAset} aset tercatat
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {totalAset > 0 && (
              <Link
                href="/cetak/aset/semua"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-3.5 sm:px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors"
              >
                <QrCode size={16} />
                <span className="hidden sm:inline">Cetak Semua Label</span>
                <span className="sm:hidden">Cetak Label</span>
              </Link>
            )}
            {bisaTambah && (
              <Link
                href="/aset/tambah-massal"
                className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-3.5 sm:px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors"
              >
                <Layers size={16} />
                Tambah Massal
              </Link>
            )}
            {bisaTambah && (
              <Link
                href="/aset/tambah"
                className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-3.5 sm:px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
              >
                <Plus size={16} />
                Tambah Aset
              </Link>
            )}
          </div>
        </div>

        {totalAset === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Belum ada data aset"
            description="Tambah aset pertama untuk mulai mencatat inventaris sekolah."
            actionLabel={bisaTambah ? "+ Tambah Aset" : undefined}
            actionHref={bisaTambah ? "/aset/tambah" : undefined}
          />
        ) : (
          <TabelAset
            initialData={daftarAsetHalamanIni}
            profil={profil ? { id: profil.id, role: profil.role } : null}
          />
        )}
      </main>
    </>
  );
}
