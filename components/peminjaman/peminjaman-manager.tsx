"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Check, X as XIcon, Undo2, HandCoins } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useDaftarPeminjamanPaginated,
  useApprovePeminjaman,
  useRejectPeminjaman,
  useKembalikanAset,
} from "@/lib/queries/peminjaman";
import { PeminjamanForm } from "./peminjaman-form";
import { StatusPeminjamanBadge } from "./status-peminjaman-badge";
import type {
  AsetWithRelasi,
  DaftarPeminjamanResult,
  PeminjamanWithRelasi,
} from "@/lib/supabase/queries";
import type { RolePengguna, StatusPeminjaman } from "@/types/database";

const PAGE_SIZE = 15;
const OPSI_STATUS: { value: StatusPeminjaman | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DIPINJAM", label: "Dipinjam" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "DIKEMBALIKAN", label: "Dikembalikan" },
];

function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Selisih (aktual - rencana) dalam hari. Positif = telat, negatif = lebih awal, 0 = pas. */
function selisihHari(rencana: string, aktual: string) {
  const msPerHari = 86400000;
  const r = new Date(rencana + "T00:00:00");
  const a = new Date(aktual + "T00:00:00");
  return Math.round((a.getTime() - r.getTime()) / msPerHari);
}

export function PeminjamanManager({
  initialData,
  asetList,
  role,
  userId,
}: {
  initialData: DaftarPeminjamanResult;
  asetList: AsetWithRelasi[];
  role: RolePengguna | undefined;
  userId: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = (searchParams.get("status") ?? "semua") as
    | StatusPeminjaman
    | "semua";
  const hanyaTerlambat = searchParams.get("terlambat") === "1";
  const qUrl = searchParams.get("q") ?? "";

  const [qInput, setQInput] = useState(qUrl);
  const qDebounced = useDebounce(qInput, 400);

  const perbaruiUrl = useCallback(
    (perubahan: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(perubahan)) {
        if (value === null || value === "" || value === "semua") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (qDebounced !== qUrl) {
      perbaruiUrl({ q: qDebounced, page: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  function gantiHalaman(p: number) {
    perbaruiUrl({ page: p === 1 ? null : p });
  }

  const { data: hasil } = useDaftarPeminjamanPaginated(
    {
      page,
      pageSize: PAGE_SIZE,
      search: qUrl,
      status,
      hanyaTerlambat,
    },
    page === 1 && !qUrl && status === "semua" && !hanyaTerlambat
      ? initialData
      : undefined
  );
  const data: PeminjamanWithRelasi[] = hasil?.data ?? [];
  const total = hasil?.count ?? 0;

  const { mutateAsync: approve, isPending: sedangApprove } =
    useApprovePeminjaman();
  const { mutateAsync: reject, isPending: sedangReject } =
    useRejectPeminjaman();
  const { mutateAsync: kembalikan, isPending: sedangKembalikan } =
    useKembalikanAset();

  const bisaApprove = role === "admin" || role === "kepsek";

  const [modalAjukan, setModalAjukan] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PeminjamanWithRelasi | null>(
    null
  );
  const [catatanReject, setCatatanReject] = useState("");

  async function konfirmasiApprove(p: PeminjamanWithRelasi) {
    try {
      const hasil = await approve(p.borrow_id);
      if (hasil && "status" in hasil && hasil.status === "DITOLAK") {
        toast.error("Otomatis ditolak — stok aset tidak cukup saat diproses");
      } else {
        toast.success("Peminjaman disetujui, stok aset berkurang");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyetujui peminjaman");
    }
  }

  async function konfirmasiReject() {
    if (!rejectTarget) return;
    try {
      await reject({ borrowId: rejectTarget.borrow_id, note: catatanReject });
      toast.success("Peminjaman ditolak");
      setRejectTarget(null);
      setCatatanReject("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menolak peminjaman");
    }
  }

  async function konfirmasiKembalikan(p: PeminjamanWithRelasi) {
    try {
      await kembalikan(p.borrow_id);
      toast.success("Aset ditandai sudah kembali, stok bertambah");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses pengembalian");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">{total} pengajuan peminjaman</p>
        <button
          onClick={() => setModalAjukan(true)}
          disabled={asetList.length === 0}
          title={
            asetList.length === 0 ? "Belum ada data aset untuk dipinjam" : undefined
          }
          className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Ajukan Peminjaman
        </button>
      </div>

      {total === 0 && !qUrl && status === "semua" && !hanyaTerlambat ? (
        <EmptyState
          icon={HandCoins}
          title="Belum ada data"
          description="Pengajuan peminjaman aset akan muncul di sini."
        />
      ) : (
        <div className="tag-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-line">
            <div className="flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-1.5 text-sm w-full sm:w-72 focus-within:border-pine transition-colors">
              <Search size={16} className="text-ink-soft" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Cari kode / nama aset..."
                className="bg-transparent outline-none w-full placeholder:text-ink-soft"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[13px] text-ink-soft whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={hanyaTerlambat}
                  onChange={(e) =>
                    perbaruiUrl({
                      terlambat: e.target.checked ? "1" : null,
                      page: null,
                    })
                  }
                />
                Hanya terlambat
              </label>
              <select
                value={status}
                onChange={(e) =>
                  perbaruiUrl({ status: e.target.value, page: null })
                }
                className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink-soft outline-none focus:border-pine transition-colors"
              >
                {OPSI_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-line">
                <th className="font-medium px-4 py-3">Aset</th>
                <th className="font-medium px-4 py-3">Peminjam</th>
                <th className="font-medium px-4 py-3">Qty</th>
                <th className="font-medium px-4 py-3">Rencana / Kembali</th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3 w-40">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {total === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-ink-soft text-[13px]"
                  >
                    <Search size={20} className="mx-auto mb-2 text-line" />
                    Tidak ada pengajuan yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              )}
              {data.map((p) => {
                const bolehApproveIni =
                  bisaApprove && p.status === "MENUNGGU" && p.peminjam_id !== userId;
                const bolehKembalikan = p.status === "DIPINJAM";
                return (
                  <tr
                    key={p.borrow_id}
                    className="border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                  >
                    <td className="px-4 py-3 text-ink">
                      <span className="font-mono text-[12px] text-ink-soft mr-1.5">
                        {p.aset?.kode_aset ?? "—"}
                      </span>
                      {p.aset?.nama ?? "Aset dihapus"}
                      {(p.status === "DIPINJAM" || p.status === "DIKEMBALIKAN") && (
                        <span className="block text-[11px] text-ink-soft/70 mt-0.5">
                          Pinjam: {formatTanggal(p.tanggal_pinjam)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.atas_nama ? (
                        <>
                          <span className="text-ink">{p.atas_nama}</span>
                          {p.catatan_pengajuan && (
                            <span className="block text-[11px] text-ink-soft/70 mt-0.5">
                              &quot;{p.catatan_pengajuan}&quot;
                            </span>
                          )}
                          <span className="block text-[11px] text-ink-soft/70 mt-0.5">
                            diajukan oleh {p.peminjam?.nama ?? "—"} (
                            {p.peminjam_role})
                          </span>
                        </>
                      ) : (
                        <>
                          {p.peminjam?.nama ?? "—"}{" "}
                          <span className="text-[11px] uppercase text-ink-soft/70">
                            ({p.peminjam_role})
                          </span>
                          {p.catatan_pengajuan && (
                            <span className="block text-[11px] text-ink-soft/70 mt-0.5">
                              &quot;{p.catatan_pengajuan}&quot;
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{p.qty}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                      {formatTanggal(p.tanggal_kembali_rencana)}
                      {p.status === "DIKEMBALIKAN" && p.tanggal_kembali_aktual && (
                        <span className="block text-[11px] mt-0.5">
                          Kembali: {formatTanggal(p.tanggal_kembali_aktual)}
                          {(() => {
                            const selisih = selisihHari(
                              p.tanggal_kembali_rencana,
                              p.tanggal_kembali_aktual
                            );
                            if (selisih > 0) {
                              return (
                                <span className="text-brick font-medium">
                                  {" "}
                                  · telat {selisih} hari
                                </span>
                              );
                            }
                            if (selisih < 0) {
                              return (
                                <span className="text-sage font-medium">
                                  {" "}
                                  · lebih awal {Math.abs(selisih)} hari
                                </span>
                              );
                            }
                            return (
                              <span className="text-sage font-medium">
                                {" "}
                                · tepat waktu
                              </span>
                            );
                          })()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPeminjamanBadge
                        status={p.status}
                        terlambat={p.terlambat}
                      />
                      {p.status === "MENUNGGU" && (
                        <span className="block text-[11px] text-ink-soft/70 mt-1">
                          Menunggu persetujuan Admin/KS
                        </span>
                      )}
                      {p.status === "DIPINJAM" && p.approver && (
                        <span className="block text-[11px] text-ink-soft/70 mt-1">
                          Disetujui oleh {p.approver.nama}
                        </span>
                      )}
                      {p.status === "DITOLAK" && (
                        <span className="block text-[11px] text-ink-soft/70 mt-1">
                          {p.approver ? `Ditolak oleh ${p.approver.nama}` : "Ditolak"}
                          {p.alasan_tolak && ` — ${p.alasan_tolak}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {bolehApproveIni && (
                          <>
                            <button
                              onClick={() => konfirmasiApprove(p)}
                              disabled={sedangApprove}
                              title="Setujui"
                              className="text-pine hover:text-pine-dark transition-colors disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setRejectTarget(p)}
                              disabled={sedangReject}
                              title="Tolak"
                              className="text-brick hover:opacity-80 transition-opacity disabled:opacity-50"
                            >
                              <XIcon size={16} />
                            </button>
                          </>
                        )}
                        {bolehKembalikan && (
                          <button
                            onClick={() => konfirmasiKembalikan(p)}
                            disabled={sedangKembalikan}
                            title="Tandai sudah kembali"
                            className="inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-pine transition-colors disabled:opacity-50"
                          >
                            <Undo2 size={14} />
                            Kembalikan
                          </button>
                        )}
                        {!bolehApproveIni && !bolehKembalikan && (
                          <span className="text-ink-soft/50">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={gantiHalaman}
          />
        </div>
      )}

      {modalAjukan && (
        <Modal title="Ajukan Peminjaman Aset" onClose={() => setModalAjukan(false)}>
          <PeminjamanForm
            asetList={asetList}
            role={role}
            onSelesai={() => setModalAjukan(false)}
          />
        </Modal>
      )}

      {rejectTarget && (
        <Modal
          title="Tolak Peminjaman?"
          onClose={() => {
            setRejectTarget(null);
            setCatatanReject("");
          }}
        >
          <p className="text-[13px] text-ink-soft mb-3">
            Tolak pengajuan peminjaman{" "}
            <span className="font-medium text-ink">
              {rejectTarget.aset?.nama ?? "aset ini"}
            </span>{" "}
            oleh{" "}
            <span className="font-medium text-ink">
              {rejectTarget.atas_nama || rejectTarget.peminjam?.nama || "—"}
            </span>
            ? Stok tidak berubah, tapi data pengajuan tetap tersimpan.
          </p>
          {rejectTarget.catatan_pengajuan && (
            <p className="text-[13px] bg-surface border border-line rounded-lg px-3 py-2 mb-3">
              <span className="text-ink-soft/70">Catatan pengajuan: </span>
              {rejectTarget.catatan_pengajuan}
            </p>
          )}
          <label className={"text-[13px] text-ink-soft block mb-1"}>
            Alasan <span className="text-ink-soft/70">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={catatanReject}
            onChange={(e) => setCatatanReject(e.target.value)}
            placeholder="mis. Aset sedang dipakai kegiatan lain"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={konfirmasiReject}
              disabled={sedangReject}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {sedangReject ? "Memproses..." : "Ya, Tolak"}
            </button>
            <button
              onClick={() => {
                setRejectTarget(null);
                setCatatanReject("");
              }}
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
