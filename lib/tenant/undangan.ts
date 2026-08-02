import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { RolePengguna } from "@/types/database";

const secretKey = () => new TextEncoder().encode(env.SESSION_SECRET);

export interface UndanganPayload {
  undanganId: string;
  sekolahId: string;
  role: RolePengguna;
  diundangOleh: string;
}

/**
 * Berlaku 7 hari — cukup lama buat diteruskan lewat WA/email ke guru.
 * `undanganId` menunjuk ke baris tabel `undangan` yang jadi sumber
 * kebenaran soal link ini sudah dipakai apa belum (lihat cek di
 * app/undangan/[token]/actions.ts) — JWT ini sendiri cuma buat verifikasi
 * cepat tanda tangan & masa berlaku tanpa perlu decode dulu baru query.
 */
export async function buatTokenUndangan(payload: UndanganPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifikasiTokenUndangan(
  token: string
): Promise<UndanganPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.undanganId !== "string" ||
      typeof payload.sekolahId !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.diundangOleh !== "string"
    ) {
      return null;
    }
    return {
      undanganId: payload.undanganId,
      sekolahId: payload.sekolahId,
      role: payload.role as RolePengguna,
      diundangOleh: payload.diundangOleh,
    };
  } catch {
    // Token kedaluwarsa, rusak, atau ditandatangani dengan secret lain.
    return null;
  }
}
