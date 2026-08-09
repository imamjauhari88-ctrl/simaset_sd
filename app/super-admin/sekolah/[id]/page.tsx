import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, DoorOpen, Users, Eye } from "lucide-react";
import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { getRingkasanSekolahDetail } from "@/lib/queries/super-admin";
import { StatCard } from "@/components/dashboard/stat-card";
import { KondisiChart } from "@/components/dashboard/kondisi-chart";
import { formatAngka, formatTanggalSingkat } from "@/lib/format";

export default async function DetailSekolahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const ringkasan = await getRingkasanSekolahDetail(id);
  if (!ringkasan) notFound();

  const { sekolah } = ringkasan;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/super-admin/sekolah"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink mb-3"
        >
          <ArrowLeft size={14} />
          Kembali ke Data Sekolah
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold text-ink">
            {sekolah.nama}
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft bg-paper border border-line px-2 py-0.5 rounded-full">
            <Eye size={11} />
            Mode Read-only
          </span>
        </div>
        <p className="text-[13px] text-ink-soft mt-1">
          {sekolah.npsn && `NPSN ${sekolah.npsn} · `}
          Daftar {formatTanggalSingkat(sekolah.created_at)}
          {sekolah.alamat && ` · ${sekolah.alamat}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Aset"
          value={formatAngka(ringkasan.totalAset)}
          icon={Boxes}
          tone="pine"
        />
        <StatCard
          label="Ruangan Terpantau"
          value={formatAngka(ringkasan.totalRuangan)}
          icon={DoorOpen}
          tone="sage"
        />
        <StatCard
          label="Total User"
          value={formatAngka(
            ringkasan.penggunaPerRole.reduce((sum, r) => sum + r.jumlah, 0)
          )}
          hint={ringkasan.penggunaPerRole
            .map((r) => `${r.jumlah} ${r.role}`)
            .join(" · ")}
          icon={Users}
          tone="brass"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <KondisiChart data={ringkasan.kondisiBreakdown} />

        <div className="tag-card p-5">
          <p className="font-display font-semibold text-ink mb-4">
            Aset Terbaru
          </p>
          {ringkasan.asetTerbaru.length === 0 ? (
            <p className="text-[13px] text-ink-soft">Belum ada aset tercatat.</p>
          ) : (
            <ul className="divide-y divide-line -mx-1">
              {ringkasan.asetTerbaru.map((a) => (
                <li key={a.id} className="px-1 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink truncate">{a.nama}</p>
                    <p className="text-[11px] text-ink-soft">{a.kode_aset}</p>
                  </div>
                  <span className="text-[11px] text-ink-soft shrink-0">
                    {formatTanggalSingkat(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
