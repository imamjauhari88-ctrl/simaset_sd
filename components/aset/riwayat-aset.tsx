import { ArrowLeftRight, Wrench, HandCoins } from "lucide-react";
import type { RiwayatAsetItem } from "@/lib/supabase/queries";
import { formatTanggalSingkat } from "@/lib/format";

const IKON: Record<RiwayatAsetItem["jenis"], typeof ArrowLeftRight> = {
  mutasi: ArrowLeftRight,
  pemeliharaan: Wrench,
  peminjaman: HandCoins,
};

const WARNA: Record<RiwayatAsetItem["jenis"], string> = {
  mutasi: "bg-sage-soft text-sage",
  pemeliharaan: "bg-brass-soft text-brass",
  peminjaman: "bg-pine-soft text-pine-dark",
};

export function RiwayatAset({ data }: { data: RiwayatAsetItem[] }) {
  return (
    <div className="tag-card p-5">
      <p className="font-display font-semibold text-ink mb-4">
        Riwayat Aset
      </p>

      {data.length === 0 ? (
        <p className="text-[13px] text-ink-soft text-center py-6">
          Belum ada riwayat mutasi, pemeliharaan, atau peminjaman buat aset
          ini.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.map((item) => {
            const Ikon = IKON[item.jenis];
            return (
              <li key={item.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${WARNA[item.jenis]}`}
                >
                  <Ikon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-ink">{item.teks}</p>
                  {item.keterangan && (
                    <p className="text-[12px] text-ink-soft mt-0.5">
                      {item.keterangan}
                    </p>
                  )}
                  <p className="text-[11px] text-ink-soft/80 mt-0.5">
                    {formatTanggalSingkat(item.tanggal)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
