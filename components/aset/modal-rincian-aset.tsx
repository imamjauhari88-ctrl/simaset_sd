import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { KondisiBadge } from "@/components/ui/kondisi-badge";
import type { KondisiAset } from "@/types/database";

type BarisRingkas = {
  id: string;
  kode_aset: string;
  nama: string;
  kondisi: KondisiAset;
  merk_tipe: string | null;
};

export function ModalRincianAset({
  judul,
  data,
  isLoading,
  filterHref,
  onClose,
}: {
  judul: string;
  data: BarisRingkas[] | undefined;
  isLoading: boolean;
  /** Link ke Data Aset dengan filter ini diterapkan — buat "Lihat
   * semua" kalau datanya kepotong (>100) atau user mau kelola lebih
   * lanjut (edit/hapus/pindah) dari halaman aslinya. */
  filterHref: string;
  onClose: () => void;
}) {
  return (
    <Modal title={judul} onClose={onClose} size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-ink-soft">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-[13px] text-ink-soft py-6 text-center">
          Belum ada aset di sini.
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
          <div className="divide-y divide-line">
            {data.map((a) => (
              <Link
                key={a.id}
                href={`/aset/${a.id}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-paper transition-colors -mx-2 px-2 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-ink truncate">{a.nama}</p>
                  <p className="text-[11px] text-ink-soft font-mono truncate">
                    {a.kode_aset}
                    {a.merk_tipe ? ` · ${a.merk_tipe}` : ""}
                  </p>
                </div>
                <KondisiBadge kondisi={a.kondisi} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href={filterHref}
        className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-pine hover:text-pine-dark font-medium border-t border-line pt-4"
      >
        Lihat & kelola di Data Aset
        <ArrowRight size={14} />
      </Link>
    </Modal>
  );
}
