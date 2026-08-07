"use client";

import { useState, useTransition } from "react";
import { School, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { updateKodeLokasi } from "@/app/(dashboard)/pengaturan/actions";
import type { Sekolah } from "@/types/database";

export function InfoSekolah({
  sekolah,
  bisaUbah = false,
}: {
  sekolah: Sekolah;
  bisaUbah?: boolean;
}) {
  const [editKodeLokasi, setEditKodeLokasi] = useState(false);
  const [nilaiKodeLokasi, setNilaiKodeLokasi] = useState(sekolah.kode_lokasi ?? "");
  const [pending, startTransition] = useTransition();

  function simpanKodeLokasi() {
    startTransition(async () => {
      try {
        await updateKodeLokasi(nilaiKodeLokasi);
        toast.success("Kode lokasi disimpan");
        setEditKodeLokasi(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan kode lokasi");
      }
    });
  }

  return (
    <div className="tag-card p-5 max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <School size={18} className="text-pine" />
        <p className="font-display font-semibold text-ink">Info Sekolah</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            Nama Sekolah
          </p>
          <p className="text-[14px] text-ink">{sekolah.nama}</p>
        </div>

        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            NPSN
          </p>
          <p className="text-[14px] text-ink">{sekolah.npsn || "—"}</p>
        </div>

        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            Alamat
          </p>
          <p className="text-[14px] text-ink">{sekolah.alamat || "—"}</p>
        </div>

        <div>
          <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-0.5">
            Kode Lokasi
          </p>
          {editKodeLokasi ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nilaiKodeLokasi}
                onChange={(e) => setNilaiKodeLokasi(e.target.value)}
                placeholder="mis. 12.13.28.08.07.03.49"
                className="flex-1 border border-line rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-pine bg-surface"
              />
              <button
                onClick={simpanKodeLokasi}
                disabled={pending}
                className="text-pine hover:text-pine-dark transition-colors disabled:opacity-60"
                title="Simpan"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => {
                  setNilaiKodeLokasi(sekolah.kode_lokasi ?? "");
                  setEditKodeLokasi(false);
                }}
                className="text-ink-soft hover:text-ink transition-colors"
                title="Batal"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-[14px] text-ink font-mono">
                {sekolah.kode_lokasi || "—"}
              </p>
              {bisaUbah && (
                <button
                  onClick={() => setEditKodeLokasi(true)}
                  className="text-ink-soft hover:text-pine transition-colors"
                  title="Ubah kode lokasi"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-ink-soft mt-1">
            Dipakai di kop cetak laporan KIB (Kartu Inventaris Barang).
          </p>
        </div>
      </div>
    </div>
  );
}
