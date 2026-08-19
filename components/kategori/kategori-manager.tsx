"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags, Boxes } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useDaftarKategori, useHapusKategori } from "@/lib/queries/kategori";
import { useAsetRingkasByKategori } from "@/lib/queries/aset";
import { ModalRincianAset } from "@/components/aset/modal-rincian-aset";
import { KategoriForm } from "./kategori-form";
import { LABEL_KODE_KIB } from "@/lib/validasi/kategori";
import type { KategoriAset } from "@/types/database";

export function KategoriManager({
  initialData,
  jumlahAset,
  bisaKelola,
}: {
  initialData: KategoriAset[];
  /** Jumlah aset per kategori (kunci = kategori_id), buat ditampilin di
   * tiap kartu — dihitung sekali di server, bukan tiap kartu query sendiri. */
  jumlahAset: Record<string, number>;
  bisaKelola: boolean;
}) {
  const { data = [] } = useDaftarKategori(initialData);
  const { mutateAsync: hapus } = useHapusKategori();

  const [modalTambah, setModalTambah] = useState(false);
  const [editKategori, setEditKategori] = useState<KategoriAset | null>(null);
  const [hapusTarget, setHapusTarget] = useState<KategoriAset | null>(null);
  const [rincianKategori, setRincianKategori] = useState<KategoriAset | null>(null);
  const { data: dataRincian, isLoading: rincianLoading } = useAsetRingkasByKategori(
    rincianKategori?.id ?? null
  );

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    try {
      await hapus(hapusTarget.id);
      toast.success("Kategori dihapus");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Gagal menghapus — mungkin masih dipakai aset lain"
      );
    } finally {
      setHapusTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">{data.length} kategori</p>
        {bisaKelola && (
          <button
            onClick={() => setModalTambah(true)}
            className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Plus size={16} />
            Tambah Kategori
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Belum ada kategori"
          description="Buat kategori (mis. Elektronik, Meubelair) untuk mengelompokkan aset."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((k) => (
            <button
              key={k.id}
              onClick={() => setRincianKategori(k)}
              className="tag-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-pine-soft flex items-center justify-center shrink-0">
                  <Tags size={16} className="text-pine" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{k.nama}</p>
                  <p className="text-[12px] text-ink-soft truncate">
                    {k.kode_kib ? LABEL_KODE_KIB[k.kode_kib] ?? k.kode_kib : "Kode KIB belum ditentukan"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-line/60">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <Boxes size={13} />
                  {jumlahAset[k.id] ?? 0} aset
                </span>
                {bisaKelola && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditKategori(k);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          setEditKategori(k);
                        }
                      }}
                      className="text-ink-soft hover:text-pine transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHapusTarget(k);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          setHapusTarget(k);
                        }
                      }}
                      className="text-ink-soft hover:text-brick transition-colors"
                      aria-label="Hapus"
                    >
                      <Trash2 size={14} />
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {modalTambah && (
        <Modal title="Tambah Kategori" onClose={() => setModalTambah(false)}>
          <KategoriForm onSelesai={() => setModalTambah(false)} />
        </Modal>
      )}

      {editKategori && (
        <Modal title="Edit Kategori" onClose={() => setEditKategori(null)}>
          <KategoriForm
            kategoriAwal={editKategori}
            onSelesai={() => setEditKategori(null)}
          />
        </Modal>
      )}

      {hapusTarget && (
        <Modal title="Hapus Kategori?" onClose={() => setHapusTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Yakin mau hapus kategori{" "}
            <span className="font-medium text-ink">{hapusTarget.nama}</span>?
            Aset yang masih pakai kategori ini bisa gagal dihapus.
          </p>
          <div className="flex gap-3">
            <button
              onClick={konfirmasiHapus}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ya, Hapus
            </button>
            <button
              onClick={() => setHapusTarget(null)}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {rincianKategori && (
        <ModalRincianAset
          judul={rincianKategori.nama}
          data={dataRincian}
          isLoading={rincianLoading}
          filterHref={`/aset?kategori=${rincianKategori.id}&nama=${encodeURIComponent(rincianKategori.nama)}`}
          onClose={() => setRincianKategori(null)}
        />
      )}
    </div>
  );
}
