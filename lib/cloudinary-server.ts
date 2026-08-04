import "server-only";
import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * Hapus 1 gambar di Cloudinary lewat Admin API (signed request).
 *
 * Beda dari upload (lib/cloudinary-upload.ts) yang unsigned lewat upload
 * preset — Cloudinary TIDAK punya mode unsigned untuk destroy, jadi ini
 * wajib pakai CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (server-only,
 * lihat lib/env.ts). Signature dihitung persis sesuai spek Cloudinary:
 * sha1("public_id=...&timestamp=..." + api_secret), parameter diurutkan
 * alfabetis (public_id sebelum timestamp, sudah pas urutannya di bawah).
 *
 * Idempotent & aman dipanggil walau publicId sudah kehapus / tidak
 * pernah ada — Cloudinary balikin result:"not found" (bukan error HTTP)
 * kalau public_id-nya tidak ketemu, itu diperlakukan sebagai sukses juga.
 */
export async function hapusFotoCloudinary(publicId: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", env.CLOUDINARY_API_KEY);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.error?.message ?? "Gagal menghapus foto lama dari Cloudinary."
    );
  }

  const data = (await res.json()) as { result?: string };
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`Cloudinary destroy gagal: ${data.result ?? "unknown"}`);
  }
}
