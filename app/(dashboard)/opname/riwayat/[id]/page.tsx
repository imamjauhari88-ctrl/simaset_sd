import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, CircleAlert } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { KondisiBadge } from "@/components/ui/kondisi-badge";
import { getDetailSesiOpname } from "@/lib/supabase/queries";
import { formatTanggalSingkat } from "@/lib/format";

export default async function DetailRiwayatOpnamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDetailSesiOpname(id);

  if (!detail) notFound();

  const { sesi, discan, belumDiscan } = detail;
  const totalDicek = discan.length + belumDiscan.length;

  return (
    <>
      <Topbar title={sesi.judul} />
      <main className="flex-1 p-6 space-y-4">
        <Link
          href="/opname/riwayat"
          className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-medium px-4 py-2 rounded-lg border border-line hover:bg-paper transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Riwayat Opname
        </Link>

        <div className="tag-card p-5">
          <p className="font-display font-semibold text-ink text-lg">
            {sesi.judul}
          </p>
          <p className="text-[13px] text-ink-soft mt-1">
            Selesai {sesi.selesai_at ? formatTanggalSingkat(sesi.selesai_at) : "—"}
            {sesi.dibuat_oleh && ` · dimulai oleh ${sesi.dibuat_oleh}`}
          </p>

          {totalDicek > 0 && (
            <div className="flex items-center gap-4 mt-4 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-sage">
                <CircleCheck size={16} />
                {discan.length} ke-scan
              </span>
              <span className="inline-flex items-center gap-1.5 text-brick">
                <CircleAlert size={16} />
                {belumDiscan.length} tidak ditemukan
              </span>
            </div>
          )}
        </div>

        {belumDiscan.length > 0 && (
          <div className="tag-card overflow-hidden">
            <div className="px-5 py-3 border-b border-line bg-brick-soft/40">
              <p className="text-[13px] font-medium text-brick">
                Tidak ditemukan / belum di-scan ({belumDiscan.length})
              </p>
            </div>
            <ul className="divide-y divide-line">
              {belumDiscan.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-2.5 text-[13px]"
                >
                  <span className="font-mono text-ink-soft">{a.kode_aset}</span>
                  <span className="text-ink">{a.nama}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="tag-card overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <p className="text-[13px] font-medium text-ink">
              Ke-scan ({discan.length})
            </p>
          </div>
          {discan.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Gak ada aset yang ke-scan di sesi ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-ink-soft border-b border-line">
                    <th className="font-medium px-5 py-2.5">Kode</th>
                    <th className="font-medium px-5 py-2.5">Nama</th>
                    <th className="font-medium px-5 py-2.5">
                      Kondisi Saat Opname
                    </th>
                    <th className="font-medium px-5 py-2.5">Catatan</th>
                    <th className="font-medium px-5 py-2.5">Waktu Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {discan.map((d) => (
                    <tr
                      key={d.asetId}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-2.5 font-mono text-ink-soft">
                        {d.kodeAset}
                      </td>
                      <td className="px-5 py-2.5 text-ink">{d.nama}</td>
                      <td className="px-5 py-2.5">
                        {d.kondisiSaatOpname ? (
                          <KondisiBadge kondisi={d.kondisiSaatOpname} />
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-ink-soft">
                        {d.catatan || "—"}
                      </td>
                      <td className="px-5 py-2.5 text-ink-soft">
                        {formatTanggalSingkat(d.waktuScan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
