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
  // Persentase asli (0-100) dari event xhr.upload.onprogress — BUKAN
  // animasi kira-kira. `fetch` gak punya cara baca progress upload body,
  // makanya di sini sengaja pakai XMLHttpRequest walau lebih verbose.
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<HasilUploadFoto | null> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        "Cloudinary belum dikonfigurasi. Cek NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME & NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      form.append("folder", "simaset/aset"); // lihat catatan folder per-sekolah di README

      const data = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
          );
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              let pesan = "Upload ke Cloudinary gagal.";
              try {
                pesan = JSON.parse(xhr.responseText)?.error?.message ?? pesan;
              } catch {
                // respons bukan JSON — pakai pesan default di atas
              }
              reject(new Error(pesan));
            }
          };
          xhr.onerror = () =>
            reject(new Error("Upload ke Cloudinary gagal (masalah jaringan)."));
          xhr.send(form);
        }
      );

      return { url: data.secure_url, publicId: data.public_id };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload foto gagal.");
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return { upload, uploading, progress, error };
}
