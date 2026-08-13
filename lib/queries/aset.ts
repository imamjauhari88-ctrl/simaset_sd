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
import {
  buatKodeAsetMassal,
  type AsetMassalFormValues,
} from "@/lib/validasi/aset-massal";

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
        kode_barang_dinas: values.kode_barang_dinas || null,
        nomor_register: values.nomor_register || null,
        no_sertifikat_dll: values.no_sertifikat_dll || null,
        ukuran_konstruksi: values.ukuran_konstruksi || null,
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

export interface HasilSimpanAsetMassal {
  jumlah: number;
  kodeAwal: string;
  kodeAkhir: string;
}

/**
 * Insert banyak aset identik sekaligus (mis. 40 kursi siswa) dalam SATU
 * kali panggilan .insert([...]) — bukan loop insert satu-satu, biar cuma
 * satu round-trip ke Supabase walau jumlahnya sampai ratusan. kode_aset
 * tiap baris digenerate dari prefix+nomor urut (lihat buatKodeAsetMassal).
 */
export function useSimpanAsetMassal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      values: AsetMassalFormValues
    ): Promise<HasilSimpanAsetMassal> => {
      const supabase = createClient();
      const kodeList = buatKodeAsetMassal(
        values.kode_prefix,
        values.nomor_mulai,
        values.jumlah
      );

      const rows = kodeList.map((kode_aset) => ({
        kode_aset,
        nama: values.nama,
        kategori_id: values.kategori_id,
        ruangan_id: values.ruangan_id,
        merk_tipe: values.merk_tipe || null,
        kode_barang_dinas: values.kode_barang_dinas || null,
        nomor_register: values.nomor_register || null,
        no_sertifikat_dll: values.no_sertifikat_dll || null,
        ukuran_konstruksi: values.ukuran_konstruksi || null,
        tahun_perolehan: values.tahun_perolehan,
        sumber_dana: values.sumber_dana,
        harga_perolehan: values.harga_perolehan,
        kondisi: values.kondisi,
        catatan: values.catatan || null,
      }));

      const { error } = await supabase.from("aset").insert(rows);

      if (error) {
        // 23505 = unique_violation Postgres, kena constraint
        // unique(sekolah_id, kode_aset) — berarti sebagian kode di
        // rentang ini udah kepakai aset lain.
        if (error.code === "23505") {
          throw new Error(
            `Sebagian kode aset di rentang ${kodeList[0]}–${
              kodeList[kodeList.length - 1]
            } sudah dipakai. Coba ganti awalan kode atau nomor mulai.`
          );
        }
        throw new Error(error.message);
      }

      return {
        jumlah: values.jumlah,
        kodeAwal: kodeList[0],
        kodeAkhir: kodeList[kodeList.length - 1],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}
