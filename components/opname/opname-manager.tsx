"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  ScanLine,
  CheckCircle2,
  StopCircle,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { QrScanner } from "./qr-scanner";
import {
  useSesiAktif,
  useMulaiSesi,
  useScanAset,
  useRingkasanOpname,
  useSelesaikanSesi,
  type AsetBelumDiscan,
} from "@/lib/queries/opname";
import type { OpnameSesi } from "@/types/database";

export function OpnameManager({
  sesiAwal,
}: {
  sesiAwal: OpnameSesi | null;
}) {
  const { data: sesi } = useSesiAktif(sesiAwal);

  if (!sesi) return <MulaiSesi />;
  return <SesiAktif sesi={sesi} />;
}

function MulaiSesi() {
  const [judul, setJudul] = useState(
    `Opname ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
  );
  const { mutateAsync, isPending } = useMulaiSesi();

  async function handleMulai() {
    if (!judul.trim()) {
      toast.error("Judul sesi wajib diisi");
      return;
    }
    try {
      await mutateAsync(judul.trim());
      toast.success("Sesi opname dimulai");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memulai sesi");
    }
  }

  return (
    <div className="space-y-4">
      <div className="tag-card p-6 max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck size={18} className="text-pine" />
          <p className="font-display font-semibold text-ink">
            Mulai Sesi Opname
          </p>
        </div>
        <p className="text-[13px] text-ink-soft mb-4">
          Cocokkan data sistem dengan kondisi fisik — scan QR di tiap aset
          satu per satu.
        </p>

        <label className="text-[13px] text-ink-soft block mb-1">
          Judul Sesi
        </label>
        <input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors mb-4"
        />

        <button
          onClick={handleMulai}
          disabled={isPending}
          className="w-full bg-pine text-white text-sm font-medium py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Memulai..." : "Mulai Sesi & Scan"}
        </button>
      </div>

      <EmptyState
        icon={ClipboardCheck}
        title="Belum ada sesi opname aktif"
        description="Setiap aset yang punya label QR (cetak dari Data Aset) bisa langsung discan di sini."
      />
    </div>
  );
}

function SesiAktif({ sesi }: { sesi: OpnameSesi }) {
  const [scanning, setScanning] = useState(false);
  const [modalSelesai, setModalSelesai] = useState(false);
  const [hasilAkhir, setHasilAkhir] = useState<AsetBelumDiscan[] | null>(null);

  const { data: ringkasan } = useRingkasanOpname(sesi.id);
  const { mutateAsync: scan } = useScanAset(sesi.id);
  const { mutateAsync: selesaikan, isPending: sedangMenyelesaikan } =
    useSelesaikanSesi(sesi.id);

  async function handleScan(kode: string) {
    try {
      const hasil = await scan(kode);
      if (!hasil.sudahDiscanSebelumnya) {
        toast.success(`${hasil.namaAset} — tercatat`, {
          description: hasil.kodeAset,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kode tidak dikenali");
    }
  }

  async function handleSelesaikan() {
    try {
      const belumDiscan = await selesaikan();
      setHasilAkhir(belumDiscan);
      setModalSelesai(false);
      toast.success("Sesi opname selesai");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyelesaikan sesi");
    }
  }

  const total = ringkasan?.totalAset ?? 0;
  const sudah = ringkasan?.totalDiscan ?? 0;
  const persen = total > 0 ? Math.min(100, Math.round((sudah / total) * 100)) : 0;

  if (hasilAkhir) {
    return (
      <div className="tag-card p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={18} className="text-sage" />
          <p className="font-display font-semibold text-ink">
            Opname &quot;{sesi.judul}&quot; Selesai
          </p>
        </div>

        {hasilAkhir.length === 0 ? (
          <p className="text-[13px] text-ink-soft mt-3">
            Semua aset berhasil discan. Nggak ada yang hilang atau kelewat 🎉
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink-soft mt-3 mb-3">
              {hasilAkhir.length} aset belum discan — perlu ditelusuri lebih
              lanjut (bisa jadi hilang, pindah tanpa dicatat, atau labelnya
              rusak):
            </p>
            <ul className="max-h-64 overflow-y-auto space-y-1.5 text-[13px]">
              {hasilAkhir.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between border-b border-line py-1.5 last:border-0"
                >
                  <span className="text-ink">{a.nama}</span>
                  <span className="font-mono text-[12px] text-ink-soft">
                    {a.kode_aset}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="tag-card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="font-display font-semibold text-ink">{sesi.judul}</p>
          <button
            onClick={() => setModalSelesai(true)}
            className="inline-flex items-center gap-1.5 text-brick text-[13px] font-medium hover:underline"
          >
            <StopCircle size={15} />
            Selesaikan Sesi
          </button>
        </div>
        <p className="text-[13px] text-ink-soft mb-3">
          {sudah} / {total} aset sudah discan
        </p>
        <div className="h-2 rounded-full bg-paper overflow-hidden">
          <div
            className="h-full bg-pine transition-all duration-500"
            style={{ width: `${persen}%` }}
          />
        </div>
      </div>

      {scanning ? (
        <div className="tag-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-ink-soft flex items-center gap-1.5">
              <ScanLine size={15} />
              Arahkan kamera ke QR di label aset
            </p>
            <button
              onClick={() => setScanning(false)}
              className="text-ink-soft hover:text-ink"
              aria-label="Tutup scanner"
            >
              <X size={18} />
            </button>
          </div>
          <QrScanner aktif={scanning} onScan={handleScan} />
        </div>
      ) : (
        <button
          onClick={() => setScanning(true)}
          className="w-full tag-card p-8 flex flex-col items-center gap-2 text-pine hover:bg-pine-soft/40 transition-colors"
        >
          <ScanLine size={28} />
          <span className="font-medium text-sm">Mulai Scan QR</span>
        </button>
      )}

      {ringkasan && ringkasan.terbaru.length > 0 && (
        <div className="tag-card p-5">
          <p className="font-display font-semibold text-ink mb-3 text-[14px]">
            Baru Discan
          </p>
          <ul className="space-y-2">
            {ringkasan.terbaru.map((t, i) => (
              <li
                key={`${t.kodeAset}-${i}`}
                className="flex items-center gap-2 text-[13px]"
              >
                <CheckCircle2 size={14} className="text-sage shrink-0" />
                <span className="text-ink">{t.namaAset}</span>
                <span className="font-mono text-[11px] text-ink-soft ml-auto">
                  {t.kodeAset}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {modalSelesai && (
        <Modal title="Selesaikan Sesi Opname?" onClose={() => setModalSelesai(false)}>
          <p className="text-[13px] text-ink-soft mb-5">
            {sudah} dari {total} aset sudah discan. Aset yang belum discan
            akan ditandai perlu ditelusuri. Yakin mau tutup sesi ini?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSelesaikan}
              disabled={sedangMenyelesaikan}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {sedangMenyelesaikan ? "Memproses..." : "Ya, Selesaikan"}
            </button>
            <button
              onClick={() => setModalSelesai(false)}
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
