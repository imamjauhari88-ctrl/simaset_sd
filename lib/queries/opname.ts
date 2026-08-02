"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { OpnameSesi } from "@/types/database";

const SESI_KEY = ["opname-sesi-aktif"] as const;
const RINGKASAN_KEY = (sesiId: string) => ["opname-ringkasan", sesiId] as const;

async function fetchSesiAktif(): Promise<OpnameSesi | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("opname_sesi")
    .select("*")
    .eq("status", "berlangsung")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function useSesiAktif(initialData?: OpnameSesi | null) {
  return useQuery({
    queryKey: SESI_KEY,
    queryFn: fetchSesiAktif,
    initialData,
  });
}

export function useMulaiSesi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (judul: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("opname_sesi")
        .insert({ judul })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as OpnameSesi;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESI_KEY }),
  });
}

export interface HasilScan {
  kodeAset: string;
  namaAset: string;
  sudahDiscanSebelumnya: boolean;
}

export function useScanAset(sesiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kodeMentah: string): Promise<HasilScan> => {
      const kode = kodeMentah.trim();
      const supabase = createClient();

      // RLS otomatis batasi ke aset sekolah sendiri — kalau QR dari
      // sekolah lain (atau bukan QR aset sama sekali), nggak bakal ketemu.
      const { data: aset, error: errAset } = await supabase
        .from("aset")
        .select("id, kode_aset, nama, kondisi")
        .eq("kode_aset", kode)
        .maybeSingle();

      if (errAset) throw new Error(errAset.message);
      if (!aset) {
        throw new Error(`Kode "${kode}" tidak ditemukan di data aset.`);
      }

      const { data: sudahAda } = await supabase
        .from("opname_detail")
        .select("id")
        .eq("sesi_id", sesiId)
        .eq("aset_id", aset.id)
        .maybeSingle();

      if (!sudahAda) {
        const { error: errInsert } = await supabase.from("opname_detail").insert({
          sesi_id: sesiId,
          aset_id: aset.id,
          kondisi_saat_opname: aset.kondisi,
        });
        if (errInsert) throw new Error(errInsert.message);
      }

      return {
        kodeAset: aset.kode_aset,
        namaAset: aset.nama,
        sudahDiscanSebelumnya: !!sudahAda,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RINGKASAN_KEY(sesiId) });
    },
  });
}

export interface RingkasanOpname {
  totalAset: number;
  totalDiscan: number;
  terbaru: { kodeAset: string; namaAset: string; waktu: string }[];
}

export function useRingkasanOpname(sesiId: string, initialData?: RingkasanOpname) {
  return useQuery({
    queryKey: RINGKASAN_KEY(sesiId),
    queryFn: async (): Promise<RingkasanOpname> => {
      const supabase = createClient();

      const [{ count: totalAset }, { data: detail, count: totalDiscan }] =
        await Promise.all([
          supabase.from("aset").select("id", { count: "exact", head: true }),
          supabase
            .from("opname_detail")
            .select("created_at, aset:aset_id ( kode_aset, nama )", {
              count: "exact",
            })
            .eq("sesi_id", sesiId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      return {
        totalAset: totalAset ?? 0,
        totalDiscan: totalDiscan ?? 0,
        terbaru: (detail ?? []).map((d) => {
          const asetRel = d.aset as unknown as { kode_aset: string; nama: string } | null;
          return {
            kodeAset: asetRel?.kode_aset ?? "—",
            namaAset: asetRel?.nama ?? "—",
            waktu: d.created_at,
          };
        }),
      };
    },
    initialData,
    refetchInterval: false,
  });
}

export interface AsetBelumDiscan {
  id: string;
  kode_aset: string;
  nama: string;
}

export function useSelesaikanSesi(sesiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<AsetBelumDiscan[]> => {
      const supabase = createClient();

      const { data: sudahDiscan } = await supabase
        .from("opname_detail")
        .select("aset_id")
        .eq("sesi_id", sesiId);

      const idSudah = (sudahDiscan ?? []).map((d) => d.aset_id);

      let queryBelum = supabase.from("aset").select("id, kode_aset, nama");
      if (idSudah.length > 0) {
        queryBelum = queryBelum.not("id", "in", `(${idSudah.join(",")})`);
      }
      const { data: belumDiscan, error: errBelum } = await queryBelum;
      if (errBelum) throw new Error(errBelum.message);

      const { error: errUpdate } = await supabase
        .from("opname_sesi")
        .update({ status: "selesai", selesai_at: new Date().toISOString() })
        .eq("id", sesiId);
      if (errUpdate) throw new Error(errUpdate.message);

      return belumDiscan ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESI_KEY });
    },
  });
}
