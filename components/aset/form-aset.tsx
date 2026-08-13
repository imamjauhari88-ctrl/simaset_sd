"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { asetSchema, asetDefaultValues, type AsetFormValues } from "@/lib/validasi/aset";
import { useSimpanAset } from "@/lib/queries/aset";
import { hapusFotoLamaAset } from "@/lib/aset/actions";
import { FotoAsetInput } from "@/components/aset/foto-aset-input";
import { TombolScanQr } from "@/components/ui/tombol-scan-qr";
import { Select } from "@/components/ui/select";
import type { KategoriAset, Ruangan, Aset } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function FormAset({
  kategoriList,
  ruanganList,
  asetAwal,
  bisaSimpan = true,
}: {
  kategoriList: KategoriAset[];
  ruanganList: Ruangan[];
  asetAwal?: Aset;
  bisaSimpan?: boolean;
}) {
  const router = useRouter();
  const { mutateAsync, isPending } = useSimpanAset();
  // Snapshot publicId foto SAAT form dibuka — dibandingkan ke publicId
  // baru pas submit sukses buat tahu apa fotonya diganti/dihapus. Sengaja
  // bukan baca dari `watch()` (itu berubah live tiap user pilih file
  // baru), harus tetap nilai ASLI sebelum form disentuh.
  const fotoPublicIdAwal = asetAwal?.foto_public_id ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AsetFormValues>({
    resolver: zodResolver(asetSchema),
    defaultValues: asetAwal
      ? {
          kode_aset: asetAwal.kode_aset,
          nama: asetAwal.nama,
          kategori_id: asetAwal.kategori_id,
          ruangan_id: asetAwal.ruangan_id,
          merk_tipe: asetAwal.merk_tipe ?? "",
          kode_barang_dinas: asetAwal.kode_barang_dinas ?? "",
          nomor_register: asetAwal.nomor_register ?? "",
          no_sertifikat_dll: asetAwal.no_sertifikat_dll ?? "",
          ukuran_konstruksi: asetAwal.ukuran_konstruksi ?? "",
          tahun_perolehan: asetAwal.tahun_perolehan,
          sumber_dana: asetAwal.sumber_dana,
          harga_perolehan: asetAwal.harga_perolehan,
          kondisi: asetAwal.kondisi,
          foto_url: asetAwal.foto_url ?? "",
          foto_public_id: asetAwal.foto_public_id ?? "",
          catatan: asetAwal.catatan ?? "",
        }
      : asetDefaultValues,
  });

  async function onSubmit(values: AsetFormValues) {
    try {
      await mutateAsync({ id: asetAwal?.id, values });
      toast.success(asetAwal ? "Perubahan disimpan" : "Aset berhasil ditambahkan");

      // Baris `aset` sudah tersimpan dengan foto BARU (atau kosong kalau
      // dihapus) di atas — sekarang aman hapus foto LAMA di Cloudinary,
      // tapi cuma kalau publicId-nya beneran berubah (diganti/dihapus),
      // bukan tiap kali form disubmit tanpa foto disentuh sama sekali.
      const fotoBerubah = fotoPublicIdAwal && fotoPublicIdAwal !== values.foto_public_id;
      if (fotoBerubah) {
        // Sengaja tidak di-await/tidak memblokir navigasi: kalaupun
        // gagal, ini cuma foto Cloudinary jadi orphan (buang-buang
        // storage), bukan data aset yang salah — baris aset sendiri
        // sudah benar tersimpan di atas. Cukup log, jangan ganggu UX
        // dengan toast error untuk hal yang bukan tanggung jawab user.
        hapusFotoLamaAset(fotoPublicIdAwal).catch((err) =>
          console.error("Gagal menghapus foto lama di Cloudinary:", err)
        );
      }

      router.push("/aset");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan aset");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="tag-card p-6 space-y-5 max-w-3xl"
    >
      {!bisaSimpan && (
        <p className="text-[13px] text-ink-soft bg-paper border border-line rounded-lg px-3 py-2">
          Kamu cuma bisa melihat data aset ini — hanya admin atau guru yang
          menambahkan aset ini yang bisa mengubahnya.
        </p>
      )}
      <fieldset disabled={!bisaSimpan} className="space-y-5 disabled:opacity-70">
      <FotoAsetInput
        fotoUrlAwal={watch("foto_url")}
        onChange={(hasil) => {
          setValue("foto_url", hasil?.url ?? "", { shouldDirty: true });
          setValue("foto_public_id", hasil?.publicId ?? "", {
            shouldDirty: true,
          });
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass + " mb-0"}>Kode Aset</label>
            <TombolScanQr
              onScan={(kode) => {
                setValue("kode_aset", kode, { shouldValidate: true, shouldDirty: true });
                toast.success(`Kode terbaca: ${kode}`);
              }}
            />
          </div>
          <input
            {...register("kode_aset")}
            placeholder="mis. ELK-0042"
            className={`${inputClass} font-mono`}
          />
          {errors.kode_aset && (
            <p className={errorClass}>{errors.kode_aset.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Nama Aset</label>
          <input
            {...register("nama")}
            placeholder="mis. Proyektor Epson EB-X06"
            className={inputClass}
          />
          {errors.nama && <p className={errorClass}>{errors.nama.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Kategori</label>
          <input type="hidden" {...register("kategori_id")} />
          <Select
            value={watch("kategori_id") ?? ""}
            onChange={(v) => setValue("kategori_id", v, { shouldValidate: true })}
            placeholder="Pilih kategori"
            options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
          />
          {errors.kategori_id && (
            <p className={errorClass}>{errors.kategori_id.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Ruangan</label>
          <input type="hidden" {...register("ruangan_id")} />
          <Select
            value={watch("ruangan_id") ?? ""}
            onChange={(v) => setValue("ruangan_id", v, { shouldValidate: true })}
            placeholder="Pilih ruangan"
            options={ruanganList.map((r) => ({ value: r.id, label: r.nama }))}
          />
          {errors.ruangan_id && (
            <p className={errorClass}>{errors.ruangan_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Merk / Tipe</label>
          <input
            {...register("merk_tipe")}
            placeholder="mis. Epson EB-X06"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tahun Perolehan</label>
          <input
            type="number"
            {...register("tahun_perolehan")}
            className={inputClass}
          />
          {errors.tahun_perolehan && (
            <p className={errorClass}>{errors.tahun_perolehan.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Harga Perolehan (Rp)</label>
          <input
            type="number"
            {...register("harga_perolehan")}
            className={inputClass}
          />
          {errors.harga_perolehan && (
            <p className={errorClass}>{errors.harga_perolehan.message}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[12px] font-medium text-ink-soft mb-1 uppercase tracking-wide">
          Data untuk Laporan Dinas
        </p>
        <p className="text-[12px] text-ink-soft mb-3">
          Opsional — isi kalau tahu kode resminya. Dipakai di laporan Buku
          Inventaris & KIB.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kode Barang (Dinas)</label>
            <input
              {...register("kode_barang_dinas")}
              placeholder="mis. 02.06.02.01.01"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Register</label>
            <input
              {...register("nomor_register")}
              placeholder="mis. 0001 atau 0001-0003"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>
              No. Sertifikat/ Pabrik/ Chasis/ Mesin
            </label>
            <input {...register("no_sertifikat_dll")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Ukuran Barang/ Konstruksi (P,S,D)
            </label>
            <input {...register("ukuran_konstruksi")} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input type="hidden" {...register("sumber_dana")} />
          <Select
            value={watch("sumber_dana") ?? "bos"}
            onChange={(v) => setValue("sumber_dana", v as AsetFormValues["sumber_dana"], { shouldValidate: true })}
            options={[
              { value: "bos", label: "BOS" },
              { value: "apbd", label: "APBD" },
              { value: "hibah", label: "Hibah" },
              { value: "swadaya", label: "Swadaya" },
              { value: "lainnya", label: "Lainnya" },
            ]}
          />
        </div>
        <div>
          <label className={labelClass}>Kondisi</label>
          <input type="hidden" {...register("kondisi")} />
          <Select
            value={watch("kondisi") ?? "baik"}
            onChange={(v) => setValue("kondisi", v as AsetFormValues["kondisi"], { shouldValidate: true })}
            options={[
              { value: "baik", label: "Baik" },
              { value: "rusak_ringan", label: "Rusak Ringan" },
              { value: "rusak_berat", label: "Rusak Berat" },
            ]}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Catatan</label>
        <textarea
          rows={3}
          {...register("catatan")}
          placeholder="Catatan tambahan (opsional)"
          className={inputClass}
        />
      </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
        {bisaSimpan && (
          <button
            type="submit"
            disabled={isPending}
            className="bg-pine text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
          >
            {isPending
              ? "Menyimpan..."
              : asetAwal
              ? "Simpan Perubahan"
              : "Simpan Aset"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-ink-soft text-sm px-5 py-2.5 rounded-lg hover:bg-paper transition-colors"
        >
          {bisaSimpan ? "Batal" : "Kembali"}
        </button>
      </div>
    </form>
  );
}
