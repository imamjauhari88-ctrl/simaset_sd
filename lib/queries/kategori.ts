"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { KategoriAset } from "@/types/database";
import type { KategoriFormValues } from "@/lib/validasi/kategori";

const KEY = ["kategori"] as const;

async function fetchKategori(): Promise<KategoriAset[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kategori_aset")
    .select("*")
    .order("nama");
  if (error) throw new Error(error.message);
  return data;
}

export function useDaftarKategori(initialData?: KategoriAset[]) {
  return useQuery({ queryKey: KEY, queryFn: fetchKategori, initialData });
}

export function useSimpanKategori() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: KategoriFormValues;
    }) => {
      const supabase = createClient();
      const payload = { nama: values.nama, kode_kib: values.kode_kib || null };
      const { error } = id
        ? await supabase.from("kategori_aset").update(payload).eq("id", id)
        : await supabase.from("kategori_aset").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useHapusKategori() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("kategori_aset").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
