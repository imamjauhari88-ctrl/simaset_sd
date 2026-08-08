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
type PeminjamanRingkas = {
  borrow_id: string;
  status: string;
  updated_at: string;
  atas_nama: string | null;
  aset: { nama: string } | null;
  peminjam: { nama: string } | null;
};

const LABEL_AKTIVITAS_PINJAM: Record<string, string> = {
  MENUNGGU: "Pengajuan peminjaman",
  DIPINJAM: "Peminjaman disetujui",
  DITOLAK: "Peminjaman ditolak",
  DIKEMBALIKAN: "Aset dikembalikan",
};

/**
 * Versi ringan dari aktivitas di Dashboard — skip "aset diubah" (butuh
 * query tambahan) supaya dropdown notifikasi tetap cepat, tapi selebihnya
 * (aset baru, mutasi, pemeliharaan, peminjaman) sama kayak Dashboard biar
 * dua tempat ini gak nampilin info yang beda-beda. Sengaja lazy
 * (`enabled`) supaya tidak ikut nge-load di setiap perpindahan halaman,
 * cuma jalan saat dropdown dibuka.
 */
async function fetchAktivitasTerbaru(): Promise<AktivitasItem[]> {
  const supabase = createClient();

  const [asetBaruRes, mutasiRes, pemeliharaanRes, peminjamanRes] =
    await Promise.all([
      supabase
        .from("aset")
        .select("id, kode_aset, nama, created_at")
        .order("created_at", { ascending: false })
        // Limit dinaikin (bukan 4) — dibutuhkan buat deteksi grouping
        // batch Tambah Aset Massal di bawah, gak bisa kedeteksi kalau
        // cuma ambil beberapa baris teratas.
        .limit(20),
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
      supabase
        .from("peminjaman_dengan_status")
        .select(
          `borrow_id, status, updated_at, atas_nama, aset:aset_id ( nama ), peminjam:peminjam_id ( nama )`
        )
        .order("updated_at", { ascending: false })
        .limit(4),
    ]);

  const asetBaru = (asetBaruRes.data ?? []) as unknown as AsetBaru[];
  const mutasi = (mutasiRes.data ?? []) as unknown as MutasiRingkas[];
  const pemeliharaan = (pemeliharaanRes.data ?? []) as unknown as PemeliharaanRingkas[];
  const peminjaman = (peminjamanRes.data ?? []) as unknown as PeminjamanRingkas[];

  const mentah: { id: string; teks: string; waktuRaw: string }[] = [];

  // Aset baru dikelompokkan per (created_at, nama) — sama kayak logic di
  // getDashboardData, biar satu batch Tambah Massal (mis. 40 kursi) gak
  // ngambil semua slot aktivitas sendirian.
  const grupAsetBaru = new Map<
    string,
    { nama: string; created_at: string; kodeContoh: string; jumlah: number }
  >();
  for (const a of asetBaru) {
    const key = `${a.created_at}|${a.nama}`;
    const existing = grupAsetBaru.get(key);
    if (existing) {
      existing.jumlah += 1;
    } else {
      grupAsetBaru.set(key, {
        nama: a.nama,
        created_at: a.created_at,
        kodeContoh: a.kode_aset,
        jumlah: 1,
      });
    }
  }
  for (const g of grupAsetBaru.values()) {
    mentah.push({
      id: `aset-baru-${g.created_at}-${g.nama}`,
      teks:
        g.jumlah > 1
          ? `${g.jumlah} aset baru ditambahkan — ${g.nama}`
          : `Aset baru ditambahkan — ${g.kodeContoh} · ${g.nama}`,
      waktuRaw: g.created_at,
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
  for (const p of peminjaman) {
    const namaPeminjam = p.atas_nama || p.peminjam?.nama || "Seseorang";
    const label = LABEL_AKTIVITAS_PINJAM[p.status] ?? "Peminjaman diperbarui";
    mentah.push({
      id: `peminjaman-${p.borrow_id}`,
      teks: `${label} — ${p.aset?.nama ?? "Aset"} (${namaPeminjam})`,
      waktuRaw: p.updated_at,
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
