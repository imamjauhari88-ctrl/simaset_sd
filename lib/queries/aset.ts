"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  AsetWithRelasi,
  DaftarAsetParams,
  DaftarAsetResult,
} from "@/lib/supabase/queries";
import type { AsetFormValues } from "@/lib/validasi/aset";

const ASET_KEY = ["aset"] as const;

async function fetchDaftarAsetPaginated(
  params: Required<DaftarAsetParams>
): Promise<DaftarAsetResult> {
  const { page, pageSize, search, kondisi } = params;
  const supabase = createClient();

  let query = supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`,
      { count: "exact" }
    );

  const kataKunci = search.trim();
  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`);
  }
  if (kondisi !== "semua") {
    query = query.eq("kondisi", kondisi);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as unknown as AsetWithRelasi[], count: count ?? 0 };
}

/**
 * Query aset berpaginasi (server-side filter + range). `initialData`
 * diisi dari fetch SSR di Server Component agar render pertama halaman
 * saat ini tidak loading; ganti halaman/pencarian/filter akan fetch ulang
 * lewat client sambil tetap menampilkan data lama (`keepPreviousData`)
 * supaya tabel tidak "kedip" kosong saat pindah halaman.
 */
export function useDaftarAsetPaginated(
  params: Required<DaftarAsetParams>,
  initialData?: DaftarAsetResult
) {
  return useQuery({
    queryKey: [...ASET_KEY, "paginated", params],
    queryFn: () => fetchDaftarAsetPaginated(params),
    initialData,
    placeholderData: keepPreviousData,
  });
}

async function fetchDaftarAset(): Promise<AsetWithRelasi[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as AsetWithRelasi[];
}

/**
 * `initialData` diisi dari fetch di Server Component (SSR) supaya halaman
 * pertama kali render tanpa loading spinner; TanStack Query lalu mengambil
 * alih untuk cache & refetch di sisi client.
 */
export function useDaftarAset(initialData?: AsetWithRelasi[]) {
  return useQuery({
    queryKey: ASET_KEY,
    queryFn: fetchDaftarAset,
    initialData,
  });
}

export function useSimpanAset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: AsetFormValues;
    }) => {
      const supabase = createClient();
      const payload = {
        ...values,
        merk_tipe: values.merk_tipe || null,
        foto_url: values.foto_url || null,
        foto_public_id: values.foto_public_id || null,
        catatan: values.catatan || null,
      };

      const { error } = id
        ? await supabase.from("aset").update(payload).eq("id", id)
        : await supabase.from("aset").insert(payload);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}
