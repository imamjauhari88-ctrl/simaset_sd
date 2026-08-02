"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ruanganSchema,
  ruanganDefaultValues,
  type RuanganFormValues,
} from "@/lib/validasi/ruangan";
import { useSimpanRuangan } from "@/lib/queries/ruangan";
import type { Ruangan } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function RuanganForm({
  ruanganAwal,
  onSelesai,
}: {
  ruanganAwal?: Ruangan;
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useSimpanRuangan();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RuanganFormValues>({
    resolver: zodResolver(ruanganSchema),
    defaultValues: ruanganAwal
      ? { nama: ruanganAwal.nama, keterangan: ruanganAwal.keterangan ?? "" }
      : ruanganDefaultValues,
  });

  async function onSubmit(values: RuanganFormValues) {
    try {
      await mutateAsync({ id: ruanganAwal?.id, values });
      toast.success(ruanganAwal ? "Ruangan diperbarui" : "Ruangan ditambahkan");
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan ruangan");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Nama Ruangan</label>
        <input
          {...register("nama")}
          placeholder="mis. Kelas 4A"
          className={inputClass}
          autoFocus
        />
        {errors.nama && <p className={errorClass}>{errors.nama.message}</p>}
      </div>
      <div>
        <label className={labelClass}>
          Keterangan <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <textarea
          {...register("keterangan")}
          rows={2}
          placeholder="mis. Lantai 2, dekat perpustakaan"
          className={inputClass}
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
