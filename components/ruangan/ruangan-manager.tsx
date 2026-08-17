"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, DoorOpen, Boxes } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useDaftarRuangan, useHapusRuangan } from "@/lib/queries/ruangan";
import { RuanganForm } from "./ruangan-form";
import type { Ruangan } from "@/types/database";

export function RuanganManager({
  initialData,
  jumlahAset,
  bisaKelola,
}: {
  initialData: Ruangan[];
  /** Jumlah aset per ruangan (kunci = ruangan_id), buat ditampilin di
   * tiap kartu — dihitung sekali di server, bukan tiap kartu query sendiri. */
  jumlahAset: Record<string, number>;
  bisaKelola: boolean;
}) {
  const { data = [] } = useDaftarRuangan(initialData);
  const { mutateAsync: hapus } = useHapusRuangan();

  const [modalTambah, setModalTambah] = useState(false);
  const [editRuangan, setEditRuangan] = useState<Ruangan | null>(null);
  const [hapusTarget, setHapusTarget] = useState<Ruangan | null>(null);

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    try {
      await hapus(hapusTarget.id);
      toast.success("Ruangan dihapus");
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
        <p className="text-[13px] text-ink-soft">{data.length} ruangan</p>
        {bisaKelola && (
          <button
            onClick={() => setModalTambah(true)}
            className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Plus size={16} />
            Tambah Ruangan
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Belum ada ruangan"
          description="Daftarkan ruangan agar aset bisa ditempatkan dan dilacak per lokasi."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((r) => (
            <div
              key={r.id}
              className="tag-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sage-soft flex items-center justify-center shrink-0">
                    <DoorOpen size={16} className="text-sage" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{r.nama}</p>
                    <p className="text-[12px] text-ink-soft truncate">
                      {r.keterangan || "Tanpa keterangan"}
                    </p>
                  </div>
                </div>
                {bisaKelola && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setEditRuangan(r)}
                      className="text-ink-soft hover:text-pine transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setHapusTarget(r)}
                      className="text-ink-soft hover:text-brick transition-colors"
                      aria-label="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-soft pt-3 border-t border-line/60">
                <Boxes size={13} />
                <span>{jumlahAset[r.id] ?? 0} aset</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalTambah && (
        <Modal title="Tambah Ruangan" onClose={() => setModalTambah(false)}>
          <RuanganForm onSelesai={() => setModalTambah(false)} />
        </Modal>
      )}

      {editRuangan && (
        <Modal title="Edit Ruangan" onClose={() => setEditRuangan(null)}>
          <RuanganForm
            ruanganAwal={editRuangan}
            onSelesai={() => setEditRuangan(null)}
          />
        </Modal>
      )}

      {hapusTarget && (
        <Modal title="Hapus Ruangan?" onClose={() => setHapusTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Yakin mau hapus ruangan{" "}
            <span className="font-medium text-ink">{hapusTarget.nama}</span>?
            Aset yang masih ditempatkan di ruangan ini bisa gagal dihapus.
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
    </div>
  );
}
