"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useDaftarKategori, useHapusKategori } from "@/lib/queries/kategori";
import { KategoriForm } from "./kategori-form";
import type { KategoriAset } from "@/types/database";

export function KategoriManager({
  initialData,
  bisaKelola,
}: {
  initialData: KategoriAset[];
  bisaKelola: boolean;
}) {
  const { data = [] } = useDaftarKategori(initialData);
  const { mutateAsync: hapus } = useHapusKategori();

  const [modalTambah, setModalTambah] = useState(false);
  const [editKategori, setEditKategori] = useState<KategoriAset | null>(null);
  const [hapusTarget, setHapusTarget] = useState<KategoriAset | null>(null);

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
        <div className="tag-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-line">
                <th className="font-medium px-4 py-3">Nama Kategori</th>
                <th className="font-medium px-4 py-3">Kode KIB</th>
                {bisaKelola && (
                  <th className="font-medium px-4 py-3 w-24">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                >
                  <td className="px-4 py-3 text-ink">{k.nama}</td>
                  <td className="px-4 py-3 text-ink-soft font-mono text-[12px]">
                    {k.kode_kib ?? "—"}
                  </td>
                  {bisaKelola && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditKategori(k)}
                          className="text-ink-soft hover:text-pine transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setHapusTarget(k)}
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
    </div>
  );
}
