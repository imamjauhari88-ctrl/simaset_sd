"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  peminjamanSchema,
  peminjamanDefaultValues,
  type PeminjamanFormValues,
} from "@/lib/validasi/peminjaman";
import { useAjukanPeminjaman } from "@/lib/queries/peminjaman";
import type { AsetWithRelasi } from "@/lib/supabase/queries";
import type { RolePengguna } from "@/types/database";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface transition-colors";
const labelClass = "text-[13px] text-ink-soft block mb-1";
const errorClass = "text-[12px] text-brick mt-1";

export function PeminjamanForm({
  asetList,
  role,
  onSelesai,
}: {
  asetList: AsetWithRelasi[];
  role: RolePengguna | undefined;
  onSelesai: () => void;
}) {
  const { mutateAsync, isPending } = useAjukanPeminjaman();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PeminjamanFormValues>({
    resolver: zodResolver(peminjamanSchema),
    defaultValues: peminjamanDefaultValues,
  });

  const asetIdDipilih = watch("aset_id");
  const asetDipilih = asetList.find((a) => a.id === asetIdDipilih);
  const otomatisDisetujui = role === "admin" || role === "kepsek";

  async function onSubmit(values: PeminjamanFormValues) {
    try {
      const hasil = await mutateAsync({
        assetId: values.aset_id,
        qty: values.qty,
        tanggalKembaliRencana: values.tanggal_kembali_rencana,
        atasNama: values.atas_nama || undefined,
        catatanPengajuan: values.catatan_pengajuan || undefined,
      });
      if (hasil && "status" in hasil && hasil.status === "DITOLAK") {
        toast.error("Pengajuan otomatis ditolak — stok aset tidak cukup");
      } else if (otomatisDisetujui) {
        toast.success("Peminjaman langsung disetujui");
      } else {
        toast.success("Pengajuan dikirim, menunggu persetujuan admin/kepsek");
      }
      onSelesai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengajukan peminjaman");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!otomatisDisetujui && (
        <p className="text-[12px] text-ink-soft bg-paper border border-line rounded-lg px-3 py-2">
          Pengajuan kamu akan berstatus <b>Menunggu</b> sampai disetujui admin
          atau kepala sekolah.
        </p>
      )}

      <div>
        <label className={labelClass}>Aset</label>
        <select {...register("aset_id")} className={inputClass} autoFocus>
          <option value="">Pilih aset</option>
          {asetList.map((a) => (
            <option key={a.id} value={a.id} disabled={a.stok < 1}>
              {a.kode_aset} — {a.nama} (stok: {a.stok})
            </option>
          ))}
        </select>
        {errors.aset_id && <p className={errorClass}>{errors.aset_id.message}</p>}
      </div>

      {asetDipilih && (
        <p className="text-[12px] text-ink-soft -mt-2">
          Stok tersedia saat ini:{" "}
          <span className="font-medium text-ink">{asetDipilih.stok}</span>
        </p>
      )}

      <div>
        <label className={labelClass}>Jumlah</label>
        <input
          type="number"
          min={1}
          {...register("qty")}
          className={inputClass}
        />
        {errors.qty && <p className={errorClass}>{errors.qty.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Rencana Tanggal Kembali</label>
        <input
          type="date"
          {...register("tanggal_kembali_rencana")}
          className={inputClass}
        />
        {errors.tanggal_kembali_rencana && (
          <p className={errorClass}>{errors.tanggal_kembali_rencana.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Nama Peminjam{" "}
          <span className="text-ink-soft/70">
            (opsional — isi kalau beda dari akunmu)
          </span>
        </label>
        <input
          {...register("atas_nama")}
          placeholder="mis. Bu Sari (guru kelas 3) — kosongkan kalau untuk diri sendiri"
          className={inputClass}
        />
        <p className="text-[11px] text-ink-soft mt-1">
          Buat dicatat kalau kamu mengajukan atas nama orang lain (mis. guru
          yang belum punya akun). Kalau kosong, dianggap untuk dirimu sendiri.
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Catatan <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <textarea
          rows={3}
          {...register("catatan_pengajuan")}
          placeholder="mis. Keperluan rapat wali murid"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || !asetIdDipilih}
          className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? "Mengirim..." : "Ajukan Peminjaman"}
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
