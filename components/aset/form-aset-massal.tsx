"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  asetMassalSchema,
  asetMassalDefaultValues,
  buatKodeAsetMassal,
  type AsetMassalFormValues,
} from "@/lib/validasi/aset-massal";
import { useSimpanAsetMassal } from "@/lib/queries/aset";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/format";
import type { KategoriAset, Ruangan } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function FormAsetMassal({
  kategoriList,
  ruanganList,
}: {
  kategoriList: KategoriAset[];
  ruanganList: Ruangan[];
}) {
  const router = useRouter();
  const { mutateAsync, isPending } = useSimpanAsetMassal();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AsetMassalFormValues>({
    resolver: zodResolver(asetMassalSchema),
    defaultValues: asetMassalDefaultValues,
  });

  // Preview kode & total harga dihitung live dari input saat ini — biar
  // user lihat dulu rentang kode yang bakal ke-generate SEBELUM submit,
  // bukan baru tau setelah data kesimpan.
  const prefix = watch("kode_prefix");
  const nomorMulai = Number(watch("nomor_mulai")) || 1;
  const jumlah = Number(watch("jumlah")) || 0;
  const harga = Number(watch("harga_perolehan")) || 0;
  const previewValid = prefix && jumlah >= 2 && jumlah <= 300;
  const kodePreview = previewValid
    ? buatKodeAsetMassal(prefix, nomorMulai, Math.min(jumlah, 300))
    : [];

  async function onSubmit(values: AsetMassalFormValues) {
    try {
      const hasil = await mutateAsync(values);
      toast.success(
        `${hasil.jumlah} aset berhasil ditambahkan (${hasil.kodeAwal} – ${hasil.kodeAkhir})`
      );
      router.push("/aset");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan aset massal");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="tag-card p-6 space-y-5 max-w-3xl"
    >
      <p className="text-[13px] text-ink-soft bg-paper border border-line rounded-lg px-3 py-2">
        Buat banyak aset identik sekaligus (mis. 40 kursi siswa) — cocok
        buat barang yang jumlahnya banyak tapi sama persis (nama, kategori,
        ruangan, harga satuan). Tiap unit tetap dapat kode & QR sendiri,
        jadi kondisinya bisa dilacak satu-satu nanti.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nama Aset</label>
          <input
            {...register("nama")}
            placeholder="mis. Kursi Siswa"
            className={inputClass}
          />
          {errors.nama && <p className={errorClass}>{errors.nama.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Jumlah Unit</label>
          <input
            type="number"
            {...register("jumlah")}
            placeholder="mis. 40"
            className={inputClass}
          />
          {errors.jumlah && (
            <p className={errorClass}>{errors.jumlah.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Awalan Kode Aset</label>
          <input
            {...register("kode_prefix")}
            placeholder="mis. MBL-KURSI"
            className={`${inputClass} font-mono uppercase`}
          />
          {errors.kode_prefix && (
            <p className={errorClass}>{errors.kode_prefix.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Nomor Mulai</label>
          <input
            type="number"
            {...register("nomor_mulai")}
            className={`${inputClass} font-mono`}
          />
          {errors.nomor_mulai && (
            <p className={errorClass}>{errors.nomor_mulai.message}</p>
          )}
        </div>
      </div>

      {kodePreview.length > 0 && (
        <div className="bg-pine-soft/40 border border-pine/20 rounded-lg px-3 py-2.5 text-[13px]">
          <span className="text-ink-soft">Kode yang akan dibuat: </span>
          <span className="font-mono font-medium text-pine-dark">
            {kodePreview[0]}
          </span>
          {kodePreview.length > 1 && (
            <>
              <span className="text-ink-soft"> s/d </span>
              <span className="font-mono font-medium text-pine-dark">
                {kodePreview[kodePreview.length - 1]}
              </span>
            </>
          )}
          {harga > 0 && jumlah > 0 && (
            <span className="text-ink-soft">
              {" "}
              — total nilai {formatRupiah(harga * jumlah)}
            </span>
          )}
        </div>
      )}

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
            placeholder="mis. Napolly NP-2802"
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
          <label className={labelClass}>Harga Satuan (Rp)</label>
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
          Opsional, berlaku sama buat semua unit yang dibuat di batch ini.
          Mis. 90 kursi siswa: Kode Barang sama buat semua, Register diisi
          satu rentang <span className="font-mono">0001-0090</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kode Barang (Dinas)</label>
            <input
              {...register("kode_barang_dinas")}
              placeholder="mis. 02.06.02.01.04"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Register (rentang)</label>
            <input
              {...register("nomor_register")}
              placeholder="mis. 0001-0090"
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
          <label className={labelClass}>Sumber Dana</label>
          <input type="hidden" {...register("sumber_dana")} />
          <Select
            value={watch("sumber_dana") ?? "bos"}
            onChange={(v) => setValue("sumber_dana", v as AsetMassalFormValues["sumber_dana"], { shouldValidate: true })}
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
          <label className={labelClass}>Kondisi Awal (semua unit)</label>
          <input type="hidden" {...register("kondisi")} />
          <Select
            value={watch("kondisi") ?? "baik"}
            onChange={(v) => setValue("kondisi", v as AsetMassalFormValues["kondisi"], { shouldValidate: true })}
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
          placeholder="Catatan tambahan buat semua unit (opsional)"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-pine text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending
            ? "Menyimpan..."
            : jumlah >= 2
              ? `Simpan ${jumlah} Aset`
              : "Simpan Aset"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-ink-soft text-sm px-5 py-2.5 rounded-lg hover:bg-paper transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
