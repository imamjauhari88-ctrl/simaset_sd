import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminEmail } from "@/lib/super-admin";
import type { User } from "@supabase/supabase-js";

/**
 * Dipanggil di awal tiap halaman/server action /super-admin. Proxy.ts
 * udah jaga ini di level middleware juga (defense in depth) — dobel
 * cek di sini biar server action yang dipanggil langsung (bukan lewat
 * navigasi halaman) tetap aman walau suatu saat middleware-nya kelewat.
 */
export async function requireSuperAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdminEmail(user.email)) {
    redirect("/login");
  }

  return user;
}
