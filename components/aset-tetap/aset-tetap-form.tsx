"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  asetTetapSchema,
  asetTetapDefaultValues,
  LABEL_JENIS_KIB,
  type AsetTetapFormValues,
} from "@/lib/validasi/aset-tetap";
import { useSimpanAsetTetap } from "@/lib/queries/aset-tetap";
import type { AsetTetap, JenisKib } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function AsetTetapForm({
  jenis,
  dataAwal,
  onSelesai,
}: {
  jenis: JenisKib;
  dataAwal?: AsetTetap;
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useSimpanAsetTetap();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AsetTetapFormValues>({
    resolver: zodResolver(asetTetapSchema),
    defaultValues: dataAwal
      ? {
          ...asetTetapDefaultValues(jenis),
          jenis_kib: jenis,
          kode_barang: dataAwal.kode_barang ?? "",
          nama: dataAwal.nama,
          tahun: dataAwal.tahun ?? "",
          harga: dataAwal.harga ?? "",
          keterangan: dataAwal.keterangan ?? "",
          ...dataAwal.detail,
        }
      : asetTetapDefaultValues(jenis),
  });

  async function onSubmit(values: AsetTetapFormValues) {
    try {
      await mutateAsync({ id: dataAwal?.id, values: { ...values, jenis_kib: jenis } });
      toast.success(dataAwal ? "Data diperbarui" : "Data ditambahkan");
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan data");
    }
  }

  const label = LABEL_JENIS_KIB[jenis];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-[12px] text-ink-soft -mt-1">
        {label.pendek} — {label.label}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Kode Barang</label>
          <input {...register("kode_barang")} placeholder="mis. 01.01.11.04.02" className={`${inputClass} font-mono`} />
        </div>
        <div>
          <label className={labelClass}>Tahun</label>
          <input {...register("tahun")} type="number" placeholder="mis. 2020" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Nama Barang</label>
        <input {...register("nama")} placeholder="mis. Tanah Milik Sekolah" className={inputClass} autoFocus />
        {errors.nama && <p className={errorClass}>{errors.nama.message}</p>}
      </div>

      {/* ===== KIB A — Tanah ===== */}
      {jenis === "A" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Luas (M²)</label>
              <input {...register("luas_m2")} placeholder="mis. 1227" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status Hak</label>
              <input {...register("status_hak")} placeholder="mis. Hak Milik" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Letak/ Alamat</label>
            <input {...register("letak_alamat")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>No. Sertifikat</label>
              <input {...register("no_sertifikat")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Penggunaan</label>
              <input {...register("penggunaan")} placeholder="mis. Gedung Sekolah" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Asal Usul</label>
            <input {...register("asal_usul")} placeholder="mis. Beli / Bantuan" className={inputClass} />
          </div>
        </>
      )}

      {/* ===== KIB C — Gedung dan Bangunan ===== */}
      {jenis === "C" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Kondisi</label>
              <select {...register("kondisi")} className={inputClass}>
                <option value="">—</option>
                <option value="baik">Baik</option>
                <option value="kurang_baik">Kurang Baik</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Bertingkat?</label>
              <input {...register("bertingkat")} placeholder="Ya / Tidak" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Beton?</label>
              <input {...register("beton")} placeholder="Ya / Tidak" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Luas Lantai (M²)</label>
              <input {...register("luas_lantai_m2")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Letak/ Lokasi</label>
              <input {...register("letak_lokasi")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status Tanah</label>
              <input {...register("status_tanah")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomor Kode Tanah</label>
              <input {...register("no_kode_tanah")} className={`${inputClass} font-mono`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Asal Usul</label>
            <input {...register("asal_usul")} placeholder="mis. Beli / Bantuan / Swadana" className={inputClass} />
          </div>
        </>
      )}

      {/* ===== KIB D — Jalan, Irigasi dan Jaringan ===== */}
      {jenis === "D" && (
        <>
          <div>
            <label className={labelClass}>Konstruksi</label>
            <input {...register("konstruksi")} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Panjang (Km)</label>
              <input {...register("panjang_km")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lebar (M)</label>
              <input {...register("lebar_m")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Luas (M²)</label>
              <input {...register("luas_m2")} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Letak/ Lokasi</label>
            <input {...register("letak_lokasi")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status Tanah</label>
              <input {...register("status_tanah")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomor Kode Tanah</label>
              <input {...register("no_kode_tanah")} className={`${inputClass} font-mono`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Asal Usul</label>
              <input {...register("asal_usul")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kondisi</label>
              <select {...register("kondisi")} className={inputClass}>
                <option value="">—</option>
                <option value="baik">Baik</option>
                <option value="kurang_baik">Kurang Baik</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* ===== KIB E — Aset Tetap Lainnya ===== */}
      {jenis === "E" && (
        <>
          <div>
            <label className={labelClass}>Jenis</label>
            <select {...register("jenis_khusus")} className={inputClass}>
              <option value="">—</option>
              <option value="buku_perpustakaan">Buku Perpustakaan</option>
              <option value="kesenian_kebudayaan">Barang Bercorak Kesenian/Kebudayaan</option>
              <option value="hewan_ternak_tumbuhan">Hewan/Ternak dan Tumbuhan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Judul/ Pencipta</label>
            <input {...register("judul_pencipta")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Spesifikasi</label>
            <input {...register("spesifikasi")} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bahan</label>
              <input {...register("bahan")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Jumlah</label>
              <input {...register("jumlah")} placeholder="mis. 3 set" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Asal Usul Cara Perolehan</label>
            <input {...register("asal_usul")} placeholder="mis. Beli / Bantuan" className={inputClass} />
          </div>
        </>
      )}

      {/* ===== KIB F — Konstruksi Dalam Pengerjaan ===== */}
      {jenis === "F" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Bangunan (P/SP/D)</label>
              <input {...register("bangunan_psp_d")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bertingkat?</label>
              <input {...register("bertingkat")} placeholder="Ya / Tidak" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Beton?</label>
              <input {...register("beton")} placeholder="Ya / Tidak" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Luas (M²)</label>
              <input {...register("luas_m2")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Letak/ Lokasi</label>
              <input {...register("letak_lokasi")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status Tanah</label>
              <input {...register("status_tanah")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomor Kode Tanah</label>
              <input {...register("no_kode_tanah")} className={`${inputClass} font-mono`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Asal Usul Pembiayaan</label>
              <input {...register("asal_usul_pembiayaan")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nilai Kontrak (Ribuan Rp)</label>
              <input {...register("nilai_kontrak")} className={inputClass} />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Harga {jenis === "F" ? "" : "Perolehan"}</label>
          <input {...register("harga")} type="number" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Keterangan</label>
          <input {...register("keterangan")} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onSelesai}
          className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
