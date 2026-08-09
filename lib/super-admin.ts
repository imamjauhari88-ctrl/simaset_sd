import { env } from "@/lib/env";

const daftarEmailSuperAdmin = env.SUPER_ADMIN_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Super admin itu developer/pemilik platform — BUKAN role di tabel
 * `profil` (yang scoped per-sekolah), makanya dicek dari daftar email di
 * env var, bukan lewat query database biasa. Sengaja begini karena super
 * admin butuh akses LINTAS sekolah (monitoring semua tenant, suspend,
 * kirim pengumuman), sesuatu yang sistem RLS multi-tenant kita sengaja
 * TIDAK izinkan buat role manapun di dalam `profil`.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return daftarEmailSuperAdmin.includes(email.toLowerCase());
}
