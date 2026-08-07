"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatWaktuRelatif } from "@/lib/format";
import type { AktivitasItem } from "@/lib/supabase/queries";

const AKTIVITAS_KEY = ["aktivitas-terbaru"] as const;

type AsetBaru = { id: string; kode_aset: string; nama: string; created_at: string };
type MutasiRingkas = {
  id: string;
  created_at: string;
  disetujui_oleh: string | null;
  aset: { nama: string } | null;
  ruangan_asal: { nama: string } | null;
  ruangan_tujuan: { nama: string } | null;
};
type PemeliharaanRingkas = {
  id: string;
  jenis: string;
  created_at: string;
  aset: { nama: string } | null;
};

/**
 * Versi ringan dari aktivitas di Dashboard — cuma aset baru, mutasi, dan
 * pemeliharaan (skip "aset diubah" yang butuh query tambahan) supaya dropdown
 * notifikasi tetap cepat. Sengaja lazy (`enabled`) supaya tidak ikut nge-load
 * di setiap perpindahan halaman, cuma jalan saat dropdown dibuka.
 */
async function fetchAktivitasTerbaru(): Promise<AktivitasItem[]> {
  const supabase = createClient();

  const [asetBaruRes, mutasiRes, pemeliharaanRes] = await Promise.all([
    supabase
      .from("aset")
      .select("id, kode_aset, nama, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("mutasi_aset")
      .select(
        `id, created_at, disetujui_oleh, aset:aset_id ( nama ), ruangan_asal:ruangan_asal_id ( nama ), ruangan_tujuan:ruangan_tujuan_id ( nama )`
      )
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("pemeliharaan_aset")
      .select(`id, jenis, created_at, aset:aset_id ( nama )`)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const asetBaru = (asetBaruRes.data ?? []) as unknown as AsetBaru[];
  const mutasi = (mutasiRes.data ?? []) as unknown as MutasiRingkas[];
  const pemeliharaan = (pemeliharaanRes.data ?? []) as unknown as PemeliharaanRingkas[];

  const mentah: { id: string; teks: string; waktuRaw: string }[] = [];

  for (const a of asetBaru) {
    mentah.push({
      id: `aset-baru-${a.id}`,
      teks: `Aset baru ditambahkan — ${a.kode_aset} · ${a.nama}`,
      waktuRaw: a.created_at,
    });
  }
  for (const m of mutasi) {
    mentah.push({
      id: `mutasi-${m.id}`,
      teks: `Mutasi dicatat — ${m.aset?.nama ?? "Aset"}: ${
        m.ruangan_asal?.nama ?? "?"
      } → ${m.ruangan_tujuan?.nama ?? "?"}${
        m.disetujui_oleh ? ` (disetujui ${m.disetujui_oleh})` : ""
      }`,
      waktuRaw: m.created_at,
    });
  }
  for (const p of pemeliharaan) {
    const jenisLabel = p.jenis === "perbaikan" ? "Perbaikan" : "Rutin";
    mentah.push({
      id: `pemeliharaan-${p.id}`,
      teks: `Pemeliharaan (${jenisLabel}) dicatat — ${p.aset?.nama ?? "Aset"}`,
      waktuRaw: p.created_at,
    });
  }

  mentah.sort((a, b) => new Date(b.waktuRaw).getTime() - new Date(a.waktuRaw).getTime());

  return mentah.slice(0, 6).map((a) => ({
    id: a.id,
    teks: a.teks,
    waktu: formatWaktuRelatif(a.waktuRaw),
    waktuRaw: a.waktuRaw,
  }));
}

/**
 * Sengaja SELALU aktif (bukan cuma pas dropdown dibuka) — badge titik
 * merah di ikon lonceng butuh tahu ada-tidaknya aktivitas baru walau
 * dropdown-nya belum pernah dibuka user. Query-nya ringan (3 select
 * dibatasi limit 4) dan React Query sudah dedupe otomatis kalau
 * beberapa <Topbar> nge-mount hook yang sama. Refetch tiap 2 menit
 * biar badge kerasa "hidup" tanpa perlu reload manual.
 */
export function useAktivitasTerbaru(enabled = true) {
  return useQuery({
    queryKey: AKTIVITAS_KEY,
    queryFn: fetchAktivitasTerbaru,
    enabled,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}
