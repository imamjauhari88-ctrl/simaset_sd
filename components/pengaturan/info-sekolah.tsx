"use client";

import { useState, useTransition } from "react";
import { School, Pencil, Check, X, FileSignature, FileX2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateKodeLokasi,
  updateDataLaporan,
  updateUsulanPenghapusanNihil,
} from "@/app/(dashboard)/pengaturan/actions";
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

  const [editLaporan, setEditLaporan] = useState(false);
  const [pendingLaporan, startTransitionLaporan] = useTransition();
  const [dataLaporan, setDataLaporan] = useState({
    kabupatenKota: sekolah.kabupaten_kota ?? "",
    provinsi: sekolah.provinsi ?? "",
    kepalaSekolahNama: sekolah.kepala_sekolah_nama ?? "",
    kepalaSekolahNip: sekolah.kepala_sekolah_nip ?? "",
    pengurusBarangNama: sekolah.pengurus_barang_nama ?? "",
    pengurusBarangNip: sekolah.pengurus_barang_nip ?? "",
  });

  const [nihilUsulan, setNihilUsulan] = useState(sekolah.usulan_penghapusan_nihil);
  const [pendingNihil, startTransitionNihil] = useTransition();

  function toggleNihilUsulan(nilai: boolean) {
    setNihilUsulan(nilai);
    startTransitionNihil(async () => {
      try {
        await updateUsulanPenghapusanNihil(nilai);
        toast.success(
          nilai
            ? "Daftar Usulan Penghapusan ditandai NIHIL"
            : "Daftar Usulan Penghapusan kembali otomatis dari data aset"
        );
      } catch (e) {
        setNihilUsulan(!nilai);
        toast.error(e instanceof Error ? e.message : "Gagal mengubah pengaturan");
      }
    });
  }

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

  function batalDataLaporan() {
    setDataLaporan({
      kabupatenKota: sekolah.kabupaten_kota ?? "",
      provinsi: sekolah.provinsi ?? "",
      kepalaSekolahNama: sekolah.kepala_sekolah_nama ?? "",
      kepalaSekolahNip: sekolah.kepala_sekolah_nip ?? "",
      pengurusBarangNama: sekolah.pengurus_barang_nama ?? "",
      pengurusBarangNip: sekolah.pengurus_barang_nip ?? "",
    });
    setEditLaporan(false);
  }

  function simpanDataLaporan() {
    startTransitionLaporan(async () => {
      try {
        await updateDataLaporan(dataLaporan);
        toast.success("Data penandatangan laporan disimpan");
        setEditLaporan(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan data laporan");
      }
    });
  }

  const inputClass =
    "w-full border border-line rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-pine bg-surface";
  const labelClass = "text-[11px] text-ink-soft uppercase tracking-wide mb-0.5 block";

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

      <div className="mt-5 pt-5 border-t border-line tag-dashed-top">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileSignature size={15} className="text-pine shrink-0" />
            <p className="text-[13px] font-medium text-ink">
              Penandatangan Laporan
            </p>
          </div>
          {bisaUbah && !editLaporan && (
            <button
              onClick={() => setEditLaporan(true)}
              className="text-ink-soft hover:text-pine transition-colors"
              title="Ubah data penandatangan"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>

        {editLaporan ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kabupaten/Kota</label>
                <input
                  value={dataLaporan.kabupatenKota}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, kabupatenKota: e.target.value }))
                  }
                  placeholder="mis. Sampang"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Provinsi</label>
                <input
                  value={dataLaporan.provinsi}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, provinsi: e.target.value }))
                  }
                  placeholder="mis. Jawa Timur"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama Kepala Sekolah</label>
                <input
                  value={dataLaporan.kepalaSekolahNama}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, kepalaSekolahNama: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>NIP Kepala Sekolah</label>
                <input
                  value={dataLaporan.kepalaSekolahNip}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, kepalaSekolahNip: e.target.value }))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama Pengurus Barang</label>
                <input
                  value={dataLaporan.pengurusBarangNama}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, pengurusBarangNama: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>NIP Pengurus Barang</label>
                <input
                  value={dataLaporan.pengurusBarangNip}
                  onChange={(e) =>
                    setDataLaporan((d) => ({ ...d, pengurusBarangNip: e.target.value }))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={simpanDataLaporan}
                disabled={pendingLaporan}
                className="inline-flex items-center gap-1.5 bg-pine text-white text-[13px] font-medium px-3.5 py-1.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
              >
                <Check size={14} />
                Simpan
              </button>
              <button
                onClick={batalDataLaporan}
                className="inline-flex items-center gap-1.5 text-ink-soft text-[13px] font-medium px-3.5 py-1.5 rounded-lg border border-line hover:bg-paper transition-colors"
              >
                <X size={14} />
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-ink-soft text-[11px]">Kab/Kota, Provinsi</p>
              <p className="text-ink">
                {sekolah.kabupaten_kota || sekolah.provinsi
                  ? `${sekolah.kabupaten_kota || "—"}, ${sekolah.provinsi || "—"}`
                  : "—"}
              </p>
            </div>
            <div />
            <div>
              <p className="text-ink-soft text-[11px]">Kepala Sekolah</p>
              <p className="text-ink">{sekolah.kepala_sekolah_nama || "—"}</p>
              <p className="text-ink-soft font-mono text-[12px]">
                {sekolah.kepala_sekolah_nip || ""}
              </p>
            </div>
            <div>
              <p className="text-ink-soft text-[11px]">Pengurus Barang</p>
              <p className="text-ink">{sekolah.pengurus_barang_nama || "—"}</p>
              <p className="text-ink-soft font-mono text-[12px]">
                {sekolah.pengurus_barang_nip || ""}
              </p>
            </div>
          </div>
        )}
        <p className="text-[11px] text-ink-soft mt-3">
          Dipakai di blok tanda tangan semua laporan cetak (KIB, KIR, Buku
          Inventaris, Daftar Usulan).
        </p>
      </div>

      <div className="mt-5 pt-5 border-t border-line tag-dashed-top">
        <div className="flex items-center gap-2 mb-3">
          <FileX2 size={15} className="text-brick shrink-0" />
          <p className="text-[13px] font-medium text-ink">
            Daftar Usulan Barang yang Dihapus
          </p>
        </div>
        <p className="text-[12px] text-ink-soft mb-3">
          Default-nya laporan ini otomatis diisi dari aset kondisi{" "}
          <span className="font-medium text-ink">Rusak Berat</span>. Kalau
          sekolah belum mau mengusulkan penghapusan, tandai NIHIL —
          laporan akan tampil kosong terlepas dari data aset yang ada.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => toggleNihilUsulan(false)}
            disabled={!bisaUbah || pendingNihil}
            className={`flex-1 text-[13px] font-medium px-3.5 py-2 rounded-lg border transition-colors disabled:opacity-60 ${
              !nihilUsulan
                ? "bg-pine text-white border-pine"
                : "border-line text-ink-soft hover:bg-paper"
            }`}
          >
            Otomatis dari Data
          </button>
          <button
            onClick={() => toggleNihilUsulan(true)}
            disabled={!bisaUbah || pendingNihil}
            className={`flex-1 text-[13px] font-medium px-3.5 py-2 rounded-lg border transition-colors disabled:opacity-60 ${
              nihilUsulan
                ? "bg-brick text-white border-brick"
                : "border-line text-ink-soft hover:bg-paper"
            }`}
          >
            Tandai NIHIL
          </button>
        </div>
      </div>
    </div>
  );
}
