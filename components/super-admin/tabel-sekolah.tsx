"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Building2,
  Eye,
  Ban,
  RotateCcw,
  Megaphone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalSingkat, formatAngka } from "@/lib/format";
import {
  suspendSekolah,
  aktifkanKembaliSekolah,
  kirimPengumuman,
} from "@/app/super-admin/actions";
import type { SekolahUntukSuperAdmin } from "@/lib/supabase/super-admin-queries";

type FilterAset = "semua" | "kosong" | "1-50" | "51-200" | "200+";

function cocokFilterAset(jumlah: number, filter: FilterAset): boolean {
  if (filter === "semua") return true;
  if (filter === "kosong") return jumlah === 0;
  if (filter === "1-50") return jumlah >= 1 && jumlah <= 50;
  if (filter === "51-200") return jumlah >= 51 && jumlah <= 200;
  return jumlah > 200;
}

export function TabelSekolah({ daftar }: { daftar: SekolahUntukSuperAdmin[] }) {
  const [pending, startTransition] = useTransition();
  const [cari, setCari] = useState("");
  const [filterAset, setFilterAset] = useState<FilterAset>("semua");

  const [suspendTarget, setSuspendTarget] = useState<SekolahUntukSuperAdmin | null>(null);
  const [alasanSuspend, setAlasanSuspend] = useState("");

  const [pengumumanTarget, setPengumumanTarget] = useState<
    SekolahUntukSuperAdmin | "semua" | null
  >(null);
  const [judulPengumuman, setJudulPengumuman] = useState("");
  const [isiPengumuman, setIsiPengumuman] = useState("");

  const hasilFilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return daftar.filter((s) => {
      const cocokCari =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.alamat?.toLowerCase().includes(q) ||
        s.npsn?.toLowerCase().includes(q) ||
        s.admin?.nama.toLowerCase().includes(q) ||
        s.admin?.email?.toLowerCase().includes(q);
      return cocokCari && cocokFilterAset(s.jumlahAset, filterAset);
    });
  }, [daftar, cari, filterAset]);

  function konfirmasiSuspend() {
    if (!suspendTarget) return;
    startTransition(async () => {
      try {
        await suspendSekolah(suspendTarget.id, alasanSuspend);
        toast.success(`${suspendTarget.nama} dinonaktifkan`);
        setSuspendTarget(null);
        setAlasanSuspend("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menonaktifkan sekolah");
      }
    });
  }

  function aktifkanLagi(s: SekolahUntukSuperAdmin) {
    startTransition(async () => {
      try {
        await aktifkanKembaliSekolah(s.id);
        toast.success(`${s.nama} diaktifkan kembali`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mengaktifkan sekolah");
      }
    });
  }

  function kirimPengumumanSekarang() {
    if (!pengumumanTarget) return;
    const sekolahId = pengumumanTarget === "semua" ? null : pengumumanTarget.id;
    startTransition(async () => {
      try {
        await kirimPengumuman(sekolahId, judulPengumuman, isiPengumuman);
        toast.success(
          pengumumanTarget === "semua"
            ? "Pengumuman dikirim ke semua sekolah"
            : `Pengumuman dikirim ke ${pengumumanTarget.nama}`
        );
        setPengumumanTarget(null);
        setJudulPengumuman("");
        setIsiPengumuman("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mengirim pengumuman");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink-soft flex-1 max-w-sm">
            <Search size={15} />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama, kota/alamat, NPSN, atau admin..."
              className="bg-transparent outline-none w-full placeholder:text-ink-soft"
            />
          </div>
          <Select
            value={filterAset}
            onChange={(v) => setFilterAset(v as FilterAset)}
            className="sm:w-56"
            options={[
              { value: "semua", label: "Semua jumlah aset" },
              { value: "kosong", label: "Belum ada aset" },
              { value: "1-50", label: "1–50 aset" },
              { value: "51-200", label: "51–200 aset" },
              { value: "200+", label: "200+ aset" },
            ]}
          />
        </div>

        <button
          onClick={() => setPengumumanTarget("semua")}
          className="inline-flex items-center gap-1.5 bg-pine text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-pine-dark transition-colors shrink-0 w-fit"
        >
          <Megaphone size={15} />
          Kirim Pengumuman ke Semua
        </button>
      </div>

      {hasilFilter.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Gak ada sekolah yang cocok"
          description="Coba ubah kata kunci pencarian atau filter jumlah aset."
        />
      ) : (
        <div className="tag-card overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="p-4 font-medium">Nama Sekolah</th>
                <th className="p-4 font-medium">Email Admin</th>
                <th className="p-4 font-medium">Tgl Daftar</th>
                <th className="p-4 font-medium text-right">Jml Aset</th>
                <th className="p-4 font-medium text-right">Jml User</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hasilFilter.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="p-4">
                    <p className="text-ink font-medium">{s.nama}</p>
                    {s.alamat && (
                      <p className="text-ink-soft text-[12px] mt-0.5">{s.alamat}</p>
                    )}
                  </td>
                  <td className="p-4 text-ink-soft">{s.admin?.email ?? "—"}</td>
                  <td className="p-4 text-ink-soft">
                    {formatTanggalSingkat(s.created_at)}
                  </td>
                  <td className="p-4 text-right text-ink">{formatAngka(s.jumlahAset)}</td>
                  <td className="p-4 text-right text-ink">{formatAngka(s.jumlahUser)}</td>
                  <td className="p-4">
                    {s.status === "aktif" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage bg-sage-soft px-2.5 py-1 rounded-full w-fit">
                        <CheckCircle2 size={12} />
                        Aktif
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brick bg-brick-soft px-2.5 py-1 rounded-full w-fit"
                        title={s.alasan_nonaktif ?? undefined}
                      >
                        <XCircle size={12} />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link
                        href={`/super-admin/sekolah/${s.id}`}
                        className="inline-flex items-center gap-1 text-ink-soft text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-paper transition-colors"
                        title="Lihat Detail (read-only)"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Detail</span>
                      </Link>
                      {s.status === "aktif" ? (
                        <button
                          onClick={() => setSuspendTarget(s)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 text-brick text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-brick-soft transition-colors disabled:opacity-60"
                          title="Suspend"
                        >
                          <Ban size={13} />
                          <span className="hidden sm:inline">Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => aktifkanLagi(s)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 text-pine text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-pine-soft transition-colors disabled:opacity-60"
                          title="Aktifkan kembali"
                        >
                          <RotateCcw size={13} />
                          <span className="hidden sm:inline">Aktifkan</span>
                        </button>
                      )}
                      <button
                        onClick={() => setPengumumanTarget(s)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 text-ink-soft text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-paper transition-colors disabled:opacity-60"
                        title="Kirim Pengumuman"
                      >
                        <Megaphone size={13} />
                        <span className="hidden sm:inline">Umumkan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suspendTarget && (
        <Modal
          title={`Suspend ${suspendTarget.nama}?`}
          onClose={() => {
            setSuspendTarget(null);
            setAlasanSuspend("");
          }}
        >
          <p className="text-[13px] text-ink-soft mb-3">
            Semua user di sekolah ini gak akan bisa masuk sampai diaktifkan lagi.
            Kasih alasan singkat (mis. spam/abuse).
          </p>
          <textarea
            value={alasanSuspend}
            onChange={(e) => setAlasanSuspend(e.target.value)}
            rows={3}
            placeholder="mis. Terindikasi akun spam, data aset tidak wajar."
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={konfirmasiSuspend}
              disabled={pending || !alasanSuspend.trim()}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? "Memproses..." : "Ya, Suspend"}
            </button>
            <button
              onClick={() => {
                setSuspendTarget(null);
                setAlasanSuspend("");
              }}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {pengumumanTarget && (
        <Modal
          title={
            pengumumanTarget === "semua"
              ? "Kirim pengumuman ke semua sekolah"
              : `Kirim pengumuman ke ${pengumumanTarget.nama}`
          }
          onClose={() => {
            setPengumumanTarget(null);
            setJudulPengumuman("");
            setIsiPengumuman("");
          }}
        >
          <div className="space-y-3 mb-4">
            <input
              value={judulPengumuman}
              onChange={(e) => setJudulPengumuman(e.target.value)}
              placeholder="Judul pengumuman"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
            <textarea
              value={isiPengumuman}
              onChange={(e) => setIsiPengumuman(e.target.value)}
              rows={4}
              placeholder="Isi pengumuman..."
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={kirimPengumumanSekarang}
              disabled={pending || !judulPengumuman.trim() || !isiPengumuman.trim()}
              className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-opacity disabled:opacity-60"
            >
              {pending ? "Mengirim..." : "Kirim"}
            </button>
            <button
              onClick={() => {
                setPengumumanTarget(null);
                setJudulPengumuman("");
                setIsiPengumuman("");
              }}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
