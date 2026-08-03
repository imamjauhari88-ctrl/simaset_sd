"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Wrench, BadgeCheck, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { daftarTahunOpsi, formatRupiah } from "@/lib/format";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useDaftarPemeliharaanPaginated,
  useHapusPemeliharaan,
  useSetujuiPemeliharaan,
} from "@/lib/queries/pemeliharaan";
import { PemeliharaanForm } from "./pemeliharaan-form";
import type {
  AsetWithRelasi,
  DaftarPemeliharaanResult,
  PemeliharaanWithRelasi,
} from "@/lib/supabase/queries";
import type { RolePengguna } from "@/types/database";

const PAGE_SIZE = 15;
const OPSI_TAHUN = daftarTahunOpsi();

export function PemeliharaanManager({
  initialData,
  asetList,
  role,
}: {
  initialData: DaftarPemeliharaanResult;
  asetList: AsetWithRelasi[];
  role: RolePengguna | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const tahun = searchParams.get("tahun") ?? "semua";
  const jenis = (searchParams.get("jenis") ?? "semua") as
    | "rutin"
    | "perbaikan"
    | "semua";
  const qUrl = searchParams.get("q") ?? "";

  // Input pencarian dipisah dari nilai yang dipakai untuk fetch, supaya
  // ketikan user terasa instan sementara request ke server ditunda
  // (debounce) sampai user berhenti mengetik.
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

  // Saat kata kunci (setelah debounce) berubah, sinkronkan ke URL dan
  // reset ke halaman 1 — hasil pencarian baru selalu mulai dari awal.
  useEffect(() => {
    if (qDebounced !== qUrl) {
      perbaruiUrl({ q: qDebounced, page: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  function gantiHalaman(p: number) {
    perbaruiUrl({ page: p === 1 ? null : p });
  }

  const { data: hasil } = useDaftarPemeliharaanPaginated(
    {
      page,
      pageSize: PAGE_SIZE,
      search: qUrl,
      tahun: tahun === "semua" ? "semua" : Number(tahun),
      jenis,
    },
    page === 1 && !qUrl && tahun === "semua" && jenis === "semua"
      ? initialData
      : undefined
  );
  const data: PemeliharaanWithRelasi[] = hasil?.data ?? [];
  const total = hasil?.count ?? 0;

  const { mutateAsync: hapus } = useHapusPemeliharaan();
  const { mutateAsync: setujui, isPending: sedangMenyetujui } =
    useSetujuiPemeliharaan();

  const bisaKelola = role === "admin";
  const bisaApprove = role === "admin" || role === "kepsek";

  const [modalTambah, setModalTambah] = useState(false);
  const [hapusTarget, setHapusTarget] = useState<PemeliharaanWithRelasi | null>(
    null
  );
  const [approveTarget, setApproveTarget] =
    useState<PemeliharaanWithRelasi | null>(null);
  const [namaPenyetuju, setNamaPenyetuju] = useState("");

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    try {
      await hapus(hapusTarget.id);
      toast.success("Riwayat pemeliharaan dihapus");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Gagal menghapus riwayat pemeliharaan"
      );
    } finally {
      setHapusTarget(null);
    }
  }

  function bukaApprove(p: PemeliharaanWithRelasi) {
    setNamaPenyetuju(p.disetujui_oleh ?? "");
    setApproveTarget(p);
  }

  async function konfirmasiApprove() {
    if (!approveTarget || !namaPenyetuju.trim()) return;
    try {
      await setujui({
        id: approveTarget.id,
        disetujui_oleh: namaPenyetuju.trim(),
      });
      toast.success("Pemeliharaan disetujui");
      setApproveTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan persetujuan");
    }
  }

  const adaAsetRusak = asetList.some((a) => a.kondisi !== "baik");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">{total} riwayat pemeliharaan</p>
        {bisaKelola && (
          <button
            onClick={() => setModalTambah(true)}
            disabled={!adaAsetRusak}
            title={!adaAsetRusak ? "Belum ada aset dengan kondisi rusak" : undefined}
            className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Catat Pemeliharaan
          </button>
        )}
      </div>

      {total === 0 && !qUrl && tahun === "semua" && jenis === "semua" ? (
        <EmptyState
          icon={Wrench}
          title="Belum ada data"
          description="Catat servis dan perbaikan aset agar riwayatnya tetap terlacak."
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
              <select
                value={jenis}
                onChange={(e) => perbaruiUrl({ jenis: e.target.value, page: null })}
                className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink-soft outline-none focus:border-pine transition-colors"
              >
                <option value="semua">Semua Jenis</option>
                <option value="rutin">Rutin</option>
                <option value="perbaikan">Perbaikan</option>
              </select>
              <select
                value={tahun}
                onChange={(e) => perbaruiUrl({ tahun: e.target.value, page: null })}
                className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink-soft outline-none focus:border-pine transition-colors"
              >
                <option value="semua">Semua Tahun</option>
                {OPSI_TAHUN.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-line">
                <th className="font-medium px-4 py-3">Tanggal</th>
                <th className="font-medium px-4 py-3">Aset</th>
                <th className="font-medium px-4 py-3">Jenis</th>
                <th className="font-medium px-4 py-3">Biaya</th>
                <th className="font-medium px-4 py-3">Keterangan</th>
                <th className="font-medium px-4 py-3">Disetujui</th>
                {bisaKelola && (
                  <th className="font-medium px-4 py-3 w-16">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {total === 0 && (
                <tr>
                  <td
                    colSpan={bisaKelola ? 7 : 6}
                    className="px-4 py-14 text-center text-ink-soft text-[13px]"
                  >
                    <Search size={20} className="mx-auto mb-2 text-line" />
                    Tidak ada riwayat pemeliharaan yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              )}
              {data.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                >
                  <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                    {new Date(p.tanggal).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <span className="font-mono text-[12px] text-ink-soft mr-1.5">
                      {p.aset?.kode_aset ?? "—"}
                    </span>
                    {p.aset?.nama ?? "Aset dihapus"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft capitalize">{p.jenis}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatRupiah(p.biaya ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft max-w-xs truncate">
                    {p.keterangan ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {bisaApprove ? (
                      <button
                        onClick={() => bukaApprove(p)}
                        className={`inline-flex items-center gap-1 hover:underline underline-offset-2 ${
                          p.disetujui_oleh ? "text-pine" : "text-ink-soft"
                        }`}
                      >
                        <BadgeCheck size={13} />
                        {p.disetujui_oleh ?? "Belum disetujui"}
                      </button>
                    ) : (
                      p.disetujui_oleh ?? "—"
                    )}
                  </td>
                  {bisaKelola && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setHapusTarget(p)}
                        className="text-ink-soft hover:text-brick transition-colors"
                        aria-label="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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

      {modalTambah && (
        <Modal title="Catat Pemeliharaan Aset" onClose={() => setModalTambah(false)}>
          <PemeliharaanForm asetList={asetList} onSelesai={() => setModalTambah(false)} />
        </Modal>
      )}

      {approveTarget && (
        <Modal title="Setujui Pemeliharaan" onClose={() => setApproveTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-3">
            Pemeliharaan{" "}
            <span className="font-medium text-ink">
              {approveTarget.aset?.nama ?? "aset ini"}
            </span>{" "}
            tanggal{" "}
            <span className="font-medium text-ink">
              {new Date(approveTarget.tanggal).toLocaleDateString("id-ID")}
            </span>
            .
          </p>
          <label className="text-[13px] text-ink-soft block mb-1">
            Disetujui oleh
          </label>
          <input
            autoFocus
            value={namaPenyetuju}
            onChange={(e) => setNamaPenyetuju(e.target.value)}
            placeholder="mis. Nama Kepala Sekolah"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={konfirmasiApprove}
              disabled={!namaPenyetuju.trim() || sedangMenyetujui}
              className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
            >
              {sedangMenyetujui ? "Menyimpan..." : "Simpan Persetujuan"}
            </button>
            <button
              onClick={() => setApproveTarget(null)}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {hapusTarget && (
        <Modal title="Hapus Riwayat Pemeliharaan?" onClose={() => setHapusTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Yakin mau hapus riwayat pemeliharaan{" "}
            <span className="font-medium text-ink">
              {hapusTarget.aset?.nama ?? "aset ini"}
            </span>{" "}
            tanggal{" "}
            <span className="font-medium text-ink">
              {new Date(hapusTarget.tanggal).toLocaleDateString("id-ID")}
            </span>
            ?
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
