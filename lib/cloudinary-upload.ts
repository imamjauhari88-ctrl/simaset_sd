"use client";

import { useState } from "react";

export interface HasilUploadFoto {
  url: string;
  publicId: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function useUploadFotoCloudinary() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<HasilUploadFoto | null> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        "Cloudinary belum dikonfigurasi. Cek NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME & NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      form.append("folder", "simaset/aset"); // lihat catatan folder per-sekolah di README

      const resUpload = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: form }
      );

      if (!resUpload.ok) {
        const body = await resUpload.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Upload ke Cloudinary gagal.");
      }
      const data = await resUpload.json();

      return { url: data.secure_url as string, publicId: data.public_id as string };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload foto gagal.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
