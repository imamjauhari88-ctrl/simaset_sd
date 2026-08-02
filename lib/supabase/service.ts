import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Client ini pakai SERVICE ROLE KEY dan BYPASS Row Level Security.
 * Hanya dipakai untuk operasi yang secara sengaja lintas-tenant, misalnya:
 * - membuat baris `sekolah` baru saat onboarding (user belum punya sekolah_id)
 * - membuat baris `profil` pertama saat user menerima link undangan
 *
 * JANGAN pernah import ini dari Client Component atau dipakai untuk query
 * data aset/kategori/ruangan biasa — pakai lib/supabase/server.ts (yang
 * tunduk ke RLS) untuk itu.
 */
export function createServiceClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
