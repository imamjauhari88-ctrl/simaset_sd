"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AsetTetap, JenisKib } from "@/types/database";
import type { AsetTetapFormValues } from "@/lib/validasi/aset-tetap";

const KEY = ["aset-tetap"] as const;

const DETAIL_KEYS = [
  "luas_m2",
  "letak_alamat",
  "status_hak",
  "tanggal_sertifikat",
  "no_sertifikat",
  "penggunaan",
  "asal_usul",
  "kondisi",
  "bertingkat",
  "beton",
  "luas_lantai_m2",
  "letak_lokasi",
  "status_tanah",
  "no_kode_tanah",
  "dokumen_tanggal",
  "dokumen_nomor",
  "konstruksi",
  "panjang_km",
  "lebar_m",
  "jenis_khusus",
  "judul_pencipta",
  "bahan",
  "jumlah",
  "bangunan_psp_d",
  "tgl_bln_thn_tanah",
  "asal_usul_pembiayaan",
  "nilai_kontrak",
] as const;

async function fetchAsetTetap(): Promise<AsetTetap[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("aset_tetap")
    .select("*")
    .order("jenis_kib")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export function useDaftarAsetTetap(initialData?: AsetTetap[]) {
  return useQuery({ queryKey: KEY, queryFn: fetchAsetTetap, initialData });
}

export function useSimpanAsetTetap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: AsetTetapFormValues;
    }) => {
      const supabase = createClient();

      const detail: Record<string, string> = {};
      for (const key of DETAIL_KEYS) {
        const v = values[key];
        if (v !== undefined && v !== "") detail[key] = String(v);
      }

      const payload = {
        jenis_kib: values.jenis_kib,
        kode_barang: values.kode_barang || null,
        nomor_register: values.nomor_register || null,
        nama: values.nama,
        tahun: values.tahun === "" ? null : Number(values.tahun),
        harga: values.harga === "" ? 0 : Number(values.harga),
        keterangan: values.keterangan || null,
        detail,
      };

      const { error } = id
        ? await supabase.from("aset_tetap").update(payload).eq("id", id)
        : await supabase.from("aset_tetap").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useHapusAsetTetap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("aset_tetap").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function filterJenis(data: AsetTetap[], jenis: JenisKib) {
  return data.filter((d) => d.jenis_kib === jenis);
}
