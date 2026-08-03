"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  approveBorrow,
  rejectBorrow,
  requestBorrow,
  returnAsset,
} from "@/lib/peminjaman/actions";
import type {
  DaftarPeminjamanParams,
  DaftarPeminjamanResult,
  PeminjamanWithRelasi,
} from "@/lib/supabase/queries";

const PEMINJAMAN_KEY = ["peminjaman"] as const;
const ASET_KEY = ["aset"] as const;

async function fetchDaftarPeminjamanPaginated(
  params: Required<DaftarPeminjamanParams>
): Promise<DaftarPeminjamanResult> {
  const { page, pageSize, search, status, hanyaTerlambat } = params;
  const supabase = createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama ), peminjam:peminjam_id ( id, nama ), approver:approver_id ( id, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama ), peminjam:peminjam_id ( id, nama ), approver:approver_id ( id, nama )`;

  let query = supabase
    .from("peminjaman_dengan_status")
    .select(selectKlausa, { count: "exact" });

  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`, {
      foreignTable: "aset",
    });
  }
  if (status !== "semua") {
    query = query.eq("status", status);
  }
  if (hanyaTerlambat) {
    query = query.eq("terlambat", true);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);
  return {
    data: (data ?? []) as unknown as PeminjamanWithRelasi[],
    count: count ?? 0,
  };
}

/** `keepPreviousData` supaya tabel nggak kedip kosong pas ganti halaman/filter. */
export function useDaftarPeminjamanPaginated(
  params: Required<DaftarPeminjamanParams>,
  initialData?: DaftarPeminjamanResult
) {
  return useQuery({
    queryKey: [...PEMINJAMAN_KEY, "paginated", params],
    queryFn: () => fetchDaftarPeminjamanPaginated(params),
    initialData,
    placeholderData: keepPreviousData,
  });
}

/**
 * Semua mutation di bawah ini cuma membungkus server actions di
 * lib/peminjaman/actions.ts (bukan query langsung ke Supabase) — karena
 * approve/reject/return HARUS lewat fungsi database (fn_approve/reject/
 * return_peminjaman), tidak boleh UPDATE tabel peminjaman langsung dari
 * client. Server memblokir itu lewat RLS (lihat schema.sql).
 */

export function useAjukanPeminjaman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestBorrow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEMINJAMAN_KEY });
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}

export function useApprovePeminjaman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (borrowId: string) => approveBorrow(borrowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEMINJAMAN_KEY });
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}

export function useRejectPeminjaman() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ borrowId, note }: { borrowId: string; note?: string }) =>
      rejectBorrow(borrowId, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PEMINJAMAN_KEY }),
  });
}

export function useKembalikanAset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (borrowId: string) => returnAsset(borrowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEMINJAMAN_KEY });
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}
