import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { getDaftarSesiOpnameSelesai } from "@/lib/supabase/queries";
import { formatTanggalSingkat } from "@/lib/format";

export default async function RiwayatOpnamePage() {
  const daftar = await getDaftarSesiOpnameSelesai();

  return (
    <>
      <Topbar title="Riwayat Opname" />
      <main className="flex-1 p-6 space-y-4">
        <Link
          href="/opname"
          className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Opname Fisik
        </Link>

        {daftar.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum ada riwayat"
            description="Sesi opname yang sudah diselesaikan bakal muncul di sini."
          />
        ) : (
          <div className="tag-card overflow-hidden">
            <ul className="divide-y divide-line">
              {daftar.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/opname/riwayat/${s.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-paper transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] text-ink font-medium truncate">
                        {s.judul}
                      </p>
                      <p className="text-[12px] text-ink-soft mt-0.5">
                        Selesai{" "}
                        {s.selesai_at
                          ? formatTanggalSingkat(s.selesai_at)
                          : "—"}
                        {s.dibuat_oleh && ` · oleh ${s.dibuat_oleh}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-ink-soft bg-paper border border-line rounded-full px-3 py-1">
                      {s.totalDiscan} aset di-scan
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
