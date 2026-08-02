"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  DaftarMutasiParams,
  DaftarMutasiResult,
  MutasiWithRelasi,
} from "@/lib/supabase/queries";
import type { MutasiFormValues } from "@/lib/validasi/mutasi";

const MUTASI_KEY = ["mutasi"] as const;
const ASET_KEY = ["aset"] as const;

async function fetchDaftarMutasiPaginated(
  params: Required<DaftarMutasiParams>
): Promise<DaftarMutasiResult> {
  const { page, pageSize, search, tahun } = params;
  const supabase = createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama ), ruangan_asal:ruangan_asal_id ( id, nama ), ruangan_tujuan:ruangan_tujuan_id ( id, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama ), ruangan_asal:ruangan_asal_id ( id, nama ), ruangan_tujuan:ruangan_tujuan_id ( id, nama )`;

  let query = supabase
    .from("mutasi_aset")
    .select(selectKlausa, { count: "exact" });

  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`, {
      foreignTable: "aset",
    });
  }
  if (tahun !== "semua") {
    query = query.gte("tanggal", `${tahun}-01-01`).lte("tanggal", `${tahun}-12-31`);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as unknown as MutasiWithRelasi[], count: count ?? 0 };
}

/** `keepPreviousData` supaya tabel nggak kedip kosong pas ganti halaman. */
export function useDaftarMutasiPaginated(
  params: Required<DaftarMutasiParams>,
  initialData?: DaftarMutasiResult
) {
  return useQuery({
    queryKey: [...MUTASI_KEY, "paginated", params],
    queryFn: () => fetchDaftarMutasiPaginated(params),
    initialData,
    placeholderData: keepPreviousData,
  });
}

/**
 * Catat mutasi = 2 langkah, bukan transaksi DB asli (pola yang sama dipakai
 * di lib/queries/opname.ts untuk hal serupa):
 *   1. Insert baris riwayat ke mutasi_aset — ruangan_asal_id diambil dari
 *      lokasi aset SAAT INI di server, bukan dari form, supaya nggak bisa
 *      salah/kelewat kalau data di form sempat basi.
 *   2. Update aset.ruangan_id ke ruangan tujuan, supaya lokasi "saat ini"
 *      aset ikut pindah.
 * Kalau langkah 2 gagal setelah langkah 1 sukses, riwayat tetap kecatat
 * tapi lokasi aset belum ikut pindah — mutationFn melempar error yang
 * menjelaskan ini supaya user tahu harus cek manual.
 */
export function useCatatMutasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: MutasiFormValues) => {
      const supabase = createClient();

      const { data: asetSaatIni, error: errAset } = await supabase
        .from("aset")
        .select("ruangan_id")
        .eq("id", values.aset_id)
        .single();
      if (errAset) throw new Error(errAset.message);

      if (asetSaatIni.ruangan_id === values.ruangan_tujuan_id) {
        throw new Error("Ruangan tujuan sama dengan lokasi aset saat ini");
      }

      const { error: errInsert } = await supabase.from("mutasi_aset").insert({
        aset_id: values.aset_id,
        ruangan_asal_id: asetSaatIni.ruangan_id,
        ruangan_tujuan_id: values.ruangan_tujuan_id,
        tanggal: values.tanggal,
        disetujui_oleh: values.disetujui_oleh || null,
        keterangan: values.keterangan || null,
      });
      if (errInsert) throw new Error(errInsert.message);

      const { error: errUpdate } = await supabase
        .from("aset")
        .update({ ruangan_id: values.ruangan_tujuan_id })
        .eq("id", values.aset_id);
      if (errUpdate) {
        throw new Error(
          `Riwayat mutasi tersimpan, tapi gagal update lokasi aset: ${errUpdate.message}`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUTASI_KEY });
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}

/**
 * Hapus HANYA baris riwayat mutasi — lokasi aset saat ini TIDAK ikut
 * dikembalikan ke ruangan asal. Kalau butuh balikin lokasi, catat mutasi
 * baru ke ruangan asalnya.
 */
/**
 * Approve (isi/ubah `disetujui_oleh`) — dipakai kepsek. RLS di server
 * yang menegakkan cuma admin & kepsek yang boleh update baris ini; guru
 * yang nekat panggil ini bakal ditolak Supabase, bukan cuma disembunyikan
 * di UI.
 */
export function useSetujuiMutasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      disetujui_oleh,
    }: {
      id: string;
      disetujui_oleh: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("mutasi_aset")
        .update({ disetujui_oleh })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MUTASI_KEY }),
  });
}

export function useHapusMutasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("mutasi_aset").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MUTASI_KEY }),
  });
}
