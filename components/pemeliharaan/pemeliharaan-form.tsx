"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  pemeliharaanSchema,
  pemeliharaanDefaultValues,
  type PemeliharaanFormValues,
} from "@/lib/validasi/pemeliharaan";
import { useCatatPemeliharaan } from "@/lib/queries/pemeliharaan";
import type { AsetWithRelasi } from "@/lib/supabase/queries";
import type { KondisiAset } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function PemeliharaanForm({
  asetList,
  onSelesai,
}: {
  asetList: AsetWithRelasi[];
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useCatatPemeliharaan();
  const [kondisiSetelah, setKondisiSetelah] = useState<KondisiAset | "">("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PemeliharaanFormValues>({
    resolver: zodResolver(pemeliharaanSchema),
    defaultValues: pemeliharaanDefaultValues,
  });

  const asetIdDipilih = watch("aset_id");
  const asetDipilih = asetList.find((a) => a.id === asetIdDipilih);
  // Cuma aset yang kondisinya rusak (ringan/berat) yang relevan buat
  // dicatat pemeliharaan-nya — aset kondisi "baik" gak perlu diperbaiki.
  const asetPerluDipelihara = asetList.filter((a) => a.kondisi !== "baik");

  async function onSubmit(values: PemeliharaanFormValues) {
    try {
      await mutateAsync({ values, kondisiSetelah });
      toast.success("Pemeliharaan dicatat");
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencatat pemeliharaan");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Aset</label>
        <select {...register("aset_id")} className={inputClass} autoFocus>
          <option value="">Pilih aset</option>
          {asetPerluDipelihara.map((a) => (
            <option key={a.id} value={a.id}>
              {a.kode_aset} — {a.nama} (
              {a.kondisi === "rusak_berat" ? "Rusak Berat" : "Rusak Ringan"})
            </option>
          ))}
        </select>
        {errors.aset_id && <p className={errorClass}>{errors.aset_id.message}</p>}
        {asetPerluDipelihara.length === 0 && (
          <p className="text-[12px] text-ink-soft mt-1">
            Semua aset kondisinya masih Baik — belum ada yang perlu
            dipelihara.
          </p>
        )}
      </div>

      {asetDipilih && (
        <p className="text-[12px] text-ink-soft -mt-2">
          Kondisi saat ini:{" "}
          <span className="font-medium text-ink">
            {{
              baik: "Baik",
              rusak_ringan: "Rusak Ringan",
              rusak_berat: "Rusak Berat",
            }[asetDipilih.kondisi]}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Jenis</label>
          <select {...register("jenis")} className={inputClass}>
            <option value="rutin">Rutin</option>
            <option value="perbaikan">Perbaikan</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" {...register("tanggal")} className={inputClass} />
          {errors.tanggal && <p className={errorClass}>{errors.tanggal.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Biaya (Rp)</label>
        <input
          type="number"
          {...register("biaya")}
          placeholder="0"
          className={inputClass}
        />
        {errors.biaya && <p className={errorClass}>{errors.biaya.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Keterangan <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <textarea
          rows={3}
          {...register("keterangan")}
          placeholder="mis. Ganti lampu proyektor"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Update Kondisi Aset Jadi{" "}
          <span className="text-ink-soft/70">(opsional, mis. abis perbaikan)</span>
        </label>
        <select
          value={kondisiSetelah}
          onChange={(e) => setKondisiSetelah(e.target.value as KondisiAset | "")}
          className={inputClass}
        >
          <option value="">Jangan ubah kondisi aset</option>
          <option value="baik">Baik</option>
          <option value="rusak_ringan">Rusak Ringan</option>
          <option value="rusak_berat">Rusak Berat</option>
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || !asetIdDipilih}
          className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Catat Pemeliharaan"}
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
