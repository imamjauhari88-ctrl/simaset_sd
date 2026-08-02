"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  DaftarPemeliharaanParams,
  DaftarPemeliharaanResult,
  PemeliharaanWithRelasi,
} from "@/lib/supabase/queries";
import type { PemeliharaanFormValues } from "@/lib/validasi/pemeliharaan";
import type { KondisiAset } from "@/types/database";

const PEMELIHARAAN_KEY = ["pemeliharaan"] as const;
const ASET_KEY = ["aset"] as const;

async function fetchDaftarPemeliharaanPaginated(
  params: Required<DaftarPemeliharaanParams>
): Promise<DaftarPemeliharaanResult> {
  const { page, pageSize, search, tahun, jenis } = params;
  const supabase = createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama )`;

  let query = supabase
    .from("pemeliharaan_aset")
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
  if (jenis !== "semua") {
    query = query.eq("jenis", jenis);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);
  return {
    data: (data ?? []) as unknown as PemeliharaanWithRelasi[],
    count: count ?? 0,
  };
}

export function useDaftarPemeliharaanPaginated(
  params: Required<DaftarPemeliharaanParams>,
  initialData?: DaftarPemeliharaanResult
) {
  return useQuery({
    queryKey: [...PEMELIHARAAN_KEY, "paginated", params],
    queryFn: () => fetchDaftarPemeliharaanPaginated(params),
    initialData,
    placeholderData: keepPreviousData,
  });
}

/**
 * Catat pemeliharaan. `kondisiSetelah` opsional — kalau diisi (mis. abis
 * perbaikan, kondisi aset berubah dari "Rusak Ringan" ke "Baik"), ikut
 * update kolom aset.kondisi. Sama seperti useCatatMutasi, ini 2 langkah
 * client-side berurutan, bukan transaksi DB asli.
 */
export function useCatatPemeliharaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      kondisiSetelah,
    }: {
      values: PemeliharaanFormValues;
      kondisiSetelah?: KondisiAset | "";
    }) => {
      const supabase = createClient();

      const { error: errInsert } = await supabase.from("pemeliharaan_aset").insert({
        aset_id: values.aset_id,
        tanggal: values.tanggal,
        jenis: values.jenis,
        biaya: values.biaya,
        keterangan: values.keterangan || null,
      });
      if (errInsert) throw new Error(errInsert.message);

      if (kondisiSetelah) {
        const { error: errUpdate } = await supabase
          .from("aset")
          .update({ kondisi: kondisiSetelah })
          .eq("id", values.aset_id);
        if (errUpdate) {
          throw new Error(
            `Riwayat pemeliharaan tersimpan, tapi gagal update kondisi aset: ${errUpdate.message}`
          );
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PEMELIHARAAN_KEY });
      if (variables.kondisiSetelah) {
        queryClient.invalidateQueries({ queryKey: ASET_KEY });
      }
    },
  });
}

/**
 * Approve (isi/ubah `disetujui_oleh`) — dipakai kepsek. RLS di server
 * yang menegakkan cuma admin & kepsek yang boleh update baris ini.
 */
export function useSetujuiPemeliharaan() {
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
        .from("pemeliharaan_aset")
        .update({ disetujui_oleh })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PEMELIHARAAN_KEY }),
  });
}

export function useHapusPemeliharaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pemeliharaan_aset")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PEMELIHARAAN_KEY }),
  });
}
