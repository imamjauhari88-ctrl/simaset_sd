"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useDaftarRuangan, useHapusRuangan } from "@/lib/queries/ruangan";
import { RuanganForm } from "./ruangan-form";
import type { Ruangan } from "@/types/database";

export function RuanganManager({
  initialData,
  bisaKelola,
}: {
  initialData: Ruangan[];
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
        <div className="tag-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-line">
                <th className="font-medium px-4 py-3">Nama Ruangan</th>
                <th className="font-medium px-4 py-3">Keterangan</th>
                {bisaKelola && (
                  <th className="font-medium px-4 py-3 w-24">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                >
                  <td className="px-4 py-3 text-ink">{r.nama}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {r.keterangan ?? "—"}
                  </td>
                  {bisaKelola && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditRuangan(r)}
                          className="text-ink-soft hover:text-pine transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setHapusTarget(r)}
                          className="text-ink-soft hover:text-brick transition-colors"
                          aria-label="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
