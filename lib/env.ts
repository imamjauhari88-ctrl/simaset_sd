import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET minimal 32 karakter (dipakai buat menandatangani token undangan)"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Cloudinary unsigned upload — keduanya boleh publik (dipakai di client),
  // makanya prefix NEXT_PUBLIC_. Batasan keamanan diatur di sisi upload
  // preset-nya sendiri di Cloudinary Dashboard, bukan lewat secret key.
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),

  // Server-only — dipakai buat signed request HAPUS foto lama (upload
  // tetap lewat unsigned preset di atas; destroy Cloudinary WAJIB signed,
  // nggak ada mode unsigned buatnya). JANGAN pernah prefix NEXT_PUBLIC_.
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

// Hanya divalidasi di server (route handler/server component/action).
// Jangan import file ini dari Client Component.
function loadServerEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  });

  if (!parsed.success) {
    console.error(
      "❌ Environment variable tidak valid:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Environment variable tidak lengkap/valid. Cek .env.local kamu terhadap .env.local.example."
    );
  }

  return parsed.data;
}

export const env = loadServerEnv();
