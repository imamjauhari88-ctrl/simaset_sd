"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  mutasiSchema,
  mutasiDefaultValues,
  type MutasiFormValues,
} from "@/lib/validasi/mutasi";
import { useCatatMutasi } from "@/lib/queries/mutasi";
import type { AsetWithRelasi } from "@/lib/supabase/queries";
import type { Ruangan } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function MutasiForm({
  asetList,
  ruanganList,
  onSelesai,
}: {
  asetList: AsetWithRelasi[];
  ruanganList: Ruangan[];
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useCatatMutasi();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MutasiFormValues>({
    resolver: zodResolver(mutasiSchema),
    defaultValues: mutasiDefaultValues,
  });

  const asetIdDipilih = watch("aset_id");
  const asetDipilih = asetList.find((a) => a.id === asetIdDipilih);

  async function onSubmit(values: MutasiFormValues) {
    try {
      await mutateAsync(values);
      toast.success("Mutasi dicatat, lokasi aset diperbarui");
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencatat mutasi");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Aset</label>
        <select {...register("aset_id")} className={inputClass} autoFocus>
          <option value="">Pilih aset</option>
          {asetList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.kode_aset} — {a.nama}
            </option>
          ))}
        </select>
        {errors.aset_id && <p className={errorClass}>{errors.aset_id.message}</p>}
      </div>

      {asetDipilih && (
        <p className="text-[12px] text-ink-soft -mt-2">
          Lokasi saat ini:{" "}
          <span className="font-medium text-ink">
            {asetDipilih.ruangan?.nama ?? "belum ada ruangan"}
          </span>
        </p>
      )}

      <div>
        <label className={labelClass}>Ruangan Tujuan</label>
        <select {...register("ruangan_tujuan_id")} className={inputClass}>
          <option value="">Pilih ruangan tujuan</option>
          {ruanganList
            .filter((r) => r.id !== asetDipilih?.ruangan_id)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
        </select>
        {errors.ruangan_tujuan_id && (
          <p className={errorClass}>{errors.ruangan_tujuan_id.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Tanggal</label>
        <input type="date" {...register("tanggal")} className={inputClass} />
        {errors.tanggal && <p className={errorClass}>{errors.tanggal.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Disetujui Oleh <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <input
          {...register("disetujui_oleh")}
          placeholder="mis. Kepala Sekolah"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Keterangan <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <textarea
          rows={3}
          {...register("keterangan")}
          placeholder="Alasan/catatan perpindahan"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || !asetIdDipilih}
          className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Catat Mutasi"}
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
