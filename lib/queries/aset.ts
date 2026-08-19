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
  buatRegisterMassal,
  type AsetMassalFormValues,
} from "@/lib/validasi/aset-massal";

const ASET_KEY = ["aset"] as const;

/** Kode aset internal aplikasi — sekarang otomatis di-generate, bukan
 * diisi manual lagi. Cuma dipakai buat isi data QR code & tracking
 * internal (mutasi/pemeliharaan/opname), gak pernah ditampilkan di
 * label cetak (yang ditampilkan Kode Barang/Register versi dinas).
 * Formatnya gak perlu human-readable, cukup unik per sekolah. */
function buatKodeAsetOtomatis(): string {
  const waktu = Date.now().toString(36).toUpperCase();
  const acak = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AST-${waktu}${acak}`;
}

/** Sama kayak buatKodeAsetOtomatis, tapi buat generate banyak kode
 * sekaligus (Tambah Massal) — dijamin gak ada yang kembar SESAMA
 * batch ini (di-generate balik kalau ternyata tabrakan; peluangnya
 * emang udah sangat kecil, ini cuma jaring pengaman tambahan). */
function buatKodeAsetOtomatisBanyak(jumlah: number): string[] {
  const hasil = new Set<string>();
  while (hasil.size < jumlah) {
    hasil.add(buatKodeAsetOtomatis());
  }
  return Array.from(hasil);
}

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
        // Kode aset auto-generate pas nambah baru; pas edit tetap
        // pertahankan kode lama (jangan pernah diganti-ganti, karena
        // udah ke-encode di QR yang mungkin udah dicetak/ditempel).
        kode_aset: id ? values.kode_aset : buatKodeAsetOtomatis(),
        merk_tipe: values.merk_tipe || null,
        bahan: values.bahan || null,
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
}

/**
 * Insert banyak aset identik sekaligus, sekarang bisa langsung kesebar
 * ke beberapa ruangan sekaligus dalam SATU kali panggilan .insert([...])
 * — bukan loop insert satu-satu, biar cuma satu round-trip ke Supabase
 * walau totalnya sampai ratusan. kode_aset tiap baris auto-generate
 * (lihat buatKodeAsetOtomatisBanyak) — sama kayak Tambah Aset satuan,
 * murni kode internal, gak perlu diisi/dilihat user lagi. Nomor Register
 * (kalau diisi) nyambung URUT LINTAS SEMUA ruangan di distribusi, bukan
 * diulang dari 1 tiap ruangan — biar pas dicetak di laporan, batch ini
 * kegabung balik jadi 1 baris rapi walau fisiknya kesebar.
 */
export function useSimpanAsetMassal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      values: AsetMassalFormValues
    ): Promise<HasilSimpanAsetMassal> => {
      const supabase = createClient();
      const totalUnit = values.distribusi.reduce((t, d) => t + d.jumlah, 0);
      const kodeList = buatKodeAsetOtomatisBanyak(totalUnit);
      // Register cuma di-generate kalau "Nomor Register Mulai" diisi —
      // kalau dikosongin, semua unit null dulu (bisa diisi manual
      // belakangan lewat Edit satu-satu).
      const registerList =
        values.register_mulai !== "" && values.register_mulai !== undefined
          ? buatRegisterMassal(values.register_mulai, totalUnit)
          : null;

      const rows: Record<string, unknown>[] = [];
      let idxGlobal = 0;
      for (const d of values.distribusi) {
        for (let i = 0; i < d.jumlah; i++) {
          rows.push({
            kode_aset: kodeList[idxGlobal],
            nama: values.nama,
            kategori_id: values.kategori_id,
            ruangan_id: d.ruangan_id,
            merk_tipe: values.merk_tipe || null,
            bahan: values.bahan || null,
            kode_barang_dinas: values.kode_barang_dinas || null,
            nomor_register: registerList ? registerList[idxGlobal] : null,
            no_sertifikat_dll: values.no_sertifikat_dll || null,
            ukuran_konstruksi: values.ukuran_konstruksi || null,
            tahun_perolehan: values.tahun_perolehan,
            sumber_dana: values.sumber_dana,
            harga_perolehan: values.harga_perolehan,
            kondisi: values.kondisi,
            catatan: values.catatan || null,
          });
          idxGlobal++;
        }
      }

      const { error } = await supabase.from("aset").insert(rows);

      if (error) {
        // 23505 = unique_violation Postgres — kode_aset auto-generate
        // acak jadi ini nyaris mustahil kejadian, tapi tetap dijaga
        // biar errornya jelas kalau toh ada, bukan pesan teknis mentah.
        if (error.code === "23505") {
          throw new Error(
            "Ada kode aset yang kebetulan tabrakan, coba simpan ulang."
          );
        }
        throw new Error(error.message);
      }

      return {
        jumlah: totalUnit,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASET_KEY });
    },
  });
}

/** Daftar aset dalam satu kategori/ruangan — dipakai modal "rincian
 * aset" pas kartu Kategori Barang / Ruangan diklik. Dibatasi 100 baris
 * biar modal-nya gak berat kalau kebetulan isinya ratusan; kalau lebih
 * dari itu, arahkan ke Data Aset (link "Lihat semua") buat lihat
 * sisanya lewat halaman biasa yang udah ada paginasinya. */
const BATAS_RINCIAN = 100;

export function useAsetRingkasByKategori(kategoriId: string | null) {
  return useQuery({
    queryKey: ["aset-ringkas-kategori", kategoriId],
    enabled: !!kategoriId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("aset")
        .select("id, kode_aset, nama, kondisi, merk_tipe")
        .eq("kategori_id", kategoriId as string)
        .order("nama")
        .limit(BATAS_RINCIAN);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useAsetRingkasByRuangan(ruanganId: string | null) {
  return useQuery({
    queryKey: ["aset-ringkas-ruangan", ruanganId],
    enabled: !!ruanganId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("aset")
        .select("id, kode_aset, nama, kondisi, merk_tipe")
        .eq("ruangan_id", ruanganId as string)
        .order("nama")
        .limit(BATAS_RINCIAN);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}
