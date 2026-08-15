"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  asetMassalSchema,
  asetMassalDefaultValues,
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
    control,
    formState: { errors },
  } = useForm<AsetMassalFormValues>({
    resolver: zodResolver(asetMassalSchema),
    defaultValues: asetMassalDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "distribusi" });

  // Preview total unit & harga dihitung live dari semua baris distribusi.
  const distribusi = watch("distribusi") ?? [];
  const jumlah = distribusi.reduce((t, d) => t + (Number(d.jumlah) || 0), 0);
  const harga = Number(watch("harga_perolehan")) || 0;
  const registerMulai = watch("register_mulai");

  // Preview rentang register per ruangan — nyambung urut lintas
  // ruangan (bukan diulang dari 1 tiap ruangan), biar keliatan jelas
  // ruangan mana kebagian nomor berapa sebelum submit.
  let kursorRegister =
    registerMulai !== "" && registerMulai !== undefined ? Number(registerMulai) : null;
  const previewPerRuangan = distribusi.map((d) => {
    const jml = Number(d.jumlah) || 0;
    if (kursorRegister === null || jml <= 0) return null;
    const awal = kursorRegister;
    const akhir = kursorRegister + jml - 1;
    kursorRegister += jml;
    return { awal, akhir };
  });

  async function onSubmit(values: AsetMassalFormValues) {
    try {
      const hasil = await mutateAsync(values);
      toast.success(`${hasil.jumlah} aset berhasil ditambahkan`);
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
        Buat banyak aset identik sekaligus (mis. 60 kursi siswa) — cocok
        buat barang yang jumlahnya banyak tapi sama persis (nama,
        kategori, harga satuan). Bisa langsung dibagi ke beberapa
        ruangan dengan jumlah beda-beda dalam satu kali input — gak
        harus rata. Tiap unit tetap dapat kode & QR sendiri, jadi
        kondisinya bisa dilacak satu-satu nanti.
      </p>

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
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass + " mb-0"}>Ruangan & Jumlah</label>
          <button
            type="button"
            onClick={() => append({ ruangan_id: "", jumlah: 1 })}
            className="inline-flex items-center gap-1 text-[12px] text-pine hover:text-pine-dark font-medium"
          >
            <Plus size={13} />
            Tambah Ruangan
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <input type="hidden" {...register(`distribusi.${idx}.ruangan_id`)} />
                <Select
                  size="sm"
                  value={watch(`distribusi.${idx}.ruangan_id`) ?? ""}
                  onChange={(v) =>
                    setValue(`distribusi.${idx}.ruangan_id`, v, { shouldValidate: true })
                  }
                  placeholder="Pilih ruangan"
                  options={ruanganList.map((r) => ({ value: r.id, label: r.nama }))}
                />
                {errors.distribusi?.[idx]?.ruangan_id && (
                  <p className={errorClass}>
                    {errors.distribusi[idx]?.ruangan_id?.message}
                  </p>
                )}
              </div>
              <div className="w-24 shrink-0">
                <input
                  type="number"
                  {...register(`distribusi.${idx}.jumlah`)}
                  placeholder="Jumlah"
                  className={`${inputClass} py-1.5 text-sm`}
                />
              </div>
              {previewPerRuangan[idx] && (
                <p className="text-[11px] text-ink-soft font-mono shrink-0 pt-2 w-24">
                  {String(previewPerRuangan[idx]!.awal).padStart(4, "0")}–
                  {String(previewPerRuangan[idx]!.akhir).padStart(4, "0")}
                </p>
              )}
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-ink-soft hover:text-brick transition-colors shrink-0 p-2"
                  aria-label="Hapus baris"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.distribusi?.message && (
          <p className={errorClass}>{errors.distribusi.message}</p>
        )}
        {errors.distribusi?.root?.message && (
          <p className={errorClass}>{errors.distribusi.root.message}</p>
        )}
      </div>

      {harga > 0 && jumlah >= 2 && (
        <div className="bg-pine-soft/40 border border-pine/20 rounded-lg px-3 py-2.5 text-[13px]">
          <span className="text-ink-soft">Estimasi total nilai </span>
          <span className="font-mono font-medium text-pine-dark">
            {formatRupiah(harga * jumlah)}
          </span>
          <span className="text-ink-soft"> untuk {jumlah} unit</span>
        </div>
      )}

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
          Opsional. Kode Barang berlaku sama buat semua unit (kode
          klasifikasi dinas emang sama buat barang sejenis). Nomor
          Register otomatis diurut nyambung lintas semua ruangan di
          atas (bukan diulang dari 1 tiap ruangan) — preview rentang
          per ruangan udah kelihatan di sebelah kolom Jumlah di atas
          begitu field ini diisi.
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
            <label className={labelClass}>Nomor Register Mulai</label>
            <input
              type="number"
              {...register("register_mulai")}
              placeholder="mis. 1"
              className={`${inputClass} font-mono`}
            />
            {errors.register_mulai && (
              <p className={errorClass}>{errors.register_mulai.message}</p>
            )}
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
            <label className={labelClass}>Bahan</label>
            <input {...register("bahan")} placeholder="mis. Kayu, Besi, Kertas" className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>
            Ukuran Barang/ Konstruksi (P,S,D)
          </label>
          <input {...register("ukuran_konstruksi")} className={inputClass} />
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
