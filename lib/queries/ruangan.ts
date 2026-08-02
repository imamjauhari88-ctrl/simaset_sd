"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Ruangan } from "@/types/database";
import type { RuanganFormValues } from "@/lib/validasi/ruangan";

const KEY = ["ruangan"] as const;

async function fetchRuangan(): Promise<Ruangan[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("ruangan").select("*").order("nama");
  if (error) throw new Error(error.message);
  return data;
}

export function useDaftarRuangan(initialData?: Ruangan[]) {
  return useQuery({ queryKey: KEY, queryFn: fetchRuangan, initialData });
}

export function useSimpanRuangan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: RuanganFormValues;
    }) => {
      const supabase = createClient();
      const payload = {
        nama: values.nama,
        keterangan: values.keterangan || null,
      };
      const { error } = id
        ? await supabase.from("ruangan").update(payload).eq("id", id)
        : await supabase.from("ruangan").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useHapusRuangan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("ruangan").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
