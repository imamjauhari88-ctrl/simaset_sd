"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useDaftarAsetTetap,
  useHapusAsetTetap,
  filterJenis,
} from "@/lib/queries/aset-tetap";
import { AsetTetapForm } from "./aset-tetap-form";
import { LABEL_JENIS_KIB } from "@/lib/validasi/aset-tetap";
import { formatAngka } from "@/lib/format";
import type { AsetTetap, JenisKib } from "@/types/database";

const TABS: JenisKib[] = ["A", "C", "D", "E", "F"];

export function AsetTetapManager({
  initialData,
  bisaKelola,
  bisaHapus,
}: {
  initialData: AsetTetap[];
  bisaKelola: boolean;
  bisaHapus: boolean;
}) {
  const { data = [] } = useDaftarAsetTetap(initialData);
  const { mutateAsync: hapus } = useHapusAsetTetap();

  const [jenisAktif, setJenisAktif] = useState<JenisKib>("A");
  const [modalTambah, setModalTambah] = useState(false);
  const [editData, setEditData] = useState<AsetTetap | null>(null);
  const [hapusTarget, setHapusTarget] = useState<AsetTetap | null>(null);

  const dataJenis = filterJenis(data, jenisAktif);

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    try {
      await hapus(hapusTarget.id);
      toast.success("Data dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus data");
    } finally {
      setHapusTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((j) => (
          <button
            key={j}
            onClick={() => setJenisAktif(j)}
            className={`shrink-0 text-[13px] font-medium px-3.5 py-2 rounded-lg transition-colors ${
              jenisAktif === j
                ? "bg-pine text-white"
                : "text-ink-soft hover:bg-paper border border-line"
            }`}
          >
            {LABEL_JENIS_KIB[j].pendek}
            <span className="hidden sm:inline"> — {LABEL_JENIS_KIB[j].label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-soft">
          {dataJenis.length} data di {LABEL_JENIS_KIB[jenisAktif].pendek}
        </p>
        {bisaKelola && (
          <button
            onClick={() => setModalTambah(true)}
            className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            <Plus size={16} />
            Tambah Data
          </button>
        )}
      </div>

      {dataJenis.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={`Belum ada data ${LABEL_JENIS_KIB[jenisAktif].pendek}`}
          description={`Catat aset ${LABEL_JENIS_KIB[jenisAktif].label.toLowerCase()} milik sekolah di sini — biasanya cuma sedikit baris, dan datanya dipakai buat laporan ${LABEL_JENIS_KIB[jenisAktif].pendek} format dinas.`}
        />
      ) : (
        <div className="tag-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-soft border-b border-line">
                  <th className="font-medium px-4 py-3">Nama Barang</th>
                  <th className="font-medium px-4 py-3">Kode Barang</th>
                  <th className="font-medium px-4 py-3">Tahun</th>
                  <th className="font-medium px-4 py-3">Harga</th>
                  {(bisaKelola || bisaHapus) && <th className="font-medium px-4 py-3 w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {dataJenis.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                  >
                    <td className="px-4 py-3 text-ink">{d.nama}</td>
                    <td className="px-4 py-3 text-ink-soft font-mono text-[12px]">
                      {d.kode_barang ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{d.tahun ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {d.harga ? `Rp ${formatAngka(d.harga)}` : "—"}
                    </td>
                    {(bisaKelola || bisaHapus) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {bisaKelola && (
                            <button
                              onClick={() => setEditData(d)}
                              className="text-ink-soft hover:text-pine transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {bisaHapus && (
                            <button
                              onClick={() => setHapusTarget(d)}
                              className="text-ink-soft hover:text-brick transition-colors"
                              aria-label="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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
        <Modal
          title={`Tambah Data ${LABEL_JENIS_KIB[jenisAktif].pendek}`}
          onClose={() => setModalTambah(false)}
          size="2xl"
        >
          <AsetTetapForm jenis={jenisAktif} onSelesai={() => setModalTambah(false)} />
        </Modal>
      )}

      {editData && (
        <Modal
          title={`Edit Data ${LABEL_JENIS_KIB[editData.jenis_kib].pendek}`}
          onClose={() => setEditData(null)}
          size="2xl"
        >
          <AsetTetapForm
            jenis={editData.jenis_kib}
            dataAwal={editData}
            onSelesai={() => setEditData(null)}
          />
        </Modal>
      )}

      {hapusTarget && (
        <Modal title="Hapus Data?" onClose={() => setHapusTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Yakin mau hapus{" "}
            <span className="font-medium text-ink">{hapusTarget.nama}</span>?
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
