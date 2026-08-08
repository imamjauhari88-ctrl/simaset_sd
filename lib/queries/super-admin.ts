import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface SekolahUntukSuperAdmin {
  id: string;
  nama: string;
  npsn: string | null;
  alamat: string | null;
  status: string;
  created_at: string;
  disetujui_at: string | null;
  ditolak_alasan: string | null;
  admin: { nama: string; email: string | null } | null;
}

/**
 * Ambil sekolah + data admin pertamanya, lintas SEMUA tenant — sengaja
 * pakai service client (bypass RLS), karena RLS di sistem ini emang
 * didesain buat NGUNCI query ke satu sekolah aja (current_sekolah_id()).
 * Super admin butuh lihat semua, itu justru di luar model RLS-nya.
 */
export async function getDaftarSekolahUntukSuperAdmin(
  status?: "menunggu_approval" | "aktif" | "ditolak"
): Promise<SekolahUntukSuperAdmin[]> {
  const service = createServiceClient();

  let query = service
    .from("sekolah")
    .select("id, nama, npsn, alamat, status, created_at, disetujui_at, ditolak_alasan")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: sekolahList, error } = await query;

  if (error || !sekolahList) {
    if (error) console.error("Gagal ambil daftar sekolah:", error.message);
    return [];
  }

  // Ambil admin pertama tiap sekolah + email-nya (email cuma ada di
  // auth.users, bukan di `profil` — makanya butuh 2 langkah + service
  // client buat baca auth.users, gak bisa lewat query biasa).
  const hasil = await Promise.all(
    sekolahList.map(async (s) => {
      const { data: adminProfil } = await service
        .from("profil")
        .select("id, nama")
        .eq("sekolah_id", s.id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      let email: string | null = null;
      if (adminProfil) {
        const { data: authUser } = await service.auth.admin.getUserById(
          adminProfil.id
        );
        email = authUser.user?.email ?? null;
      }

      return {
        ...s,
        admin: adminProfil ? { nama: adminProfil.nama, email } : null,
      };
    })
  );

  return hasil;
}
