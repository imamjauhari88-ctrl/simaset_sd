"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  kategoriSchema,
  kategoriDefaultValues,
  type KategoriFormValues,
} from "@/lib/validasi/kategori";
import { useSimpanKategori } from "@/lib/queries/kategori";
import type { KategoriAset } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function KategoriForm({
  kategoriAwal,
  onSelesai,
}: {
  kategoriAwal?: KategoriAset;
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useSimpanKategori();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KategoriFormValues>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: kategoriAwal
      ? { nama: kategoriAwal.nama, kode_kib: kategoriAwal.kode_kib ?? "" }
      : kategoriDefaultValues,
  });

  async function onSubmit(values: KategoriFormValues) {
    try {
      await mutateAsync({ id: kategoriAwal?.id, values });
      toast.success(kategoriAwal ? "Kategori diperbarui" : "Kategori ditambahkan");
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan kategori");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Nama Kategori</label>
        <input
          {...register("nama")}
          placeholder="mis. Elektronik"
          className={inputClass}
          autoFocus
        />
        {errors.nama && <p className={errorClass}>{errors.nama.message}</p>}
      </div>
      <div>
        <label className={labelClass}>
          Kode KIB <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <input
          {...register("kode_kib")}
          placeholder="mis. KIB-B"
          className={`${inputClass} font-mono`}
        />
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
