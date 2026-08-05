"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useUploadFotoCloudinary } from "@/lib/cloudinary-upload";

export function FotoAsetInput({
  fotoUrlAwal,
  onChange,
}: {
  fotoUrlAwal?: string | null;
  onChange: (hasil: { url: string; publicId: string } | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(fotoUrlAwal ?? null);
  const { upload, uploading, progress, error } = useUploadFotoCloudinary();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file)); // preview instan sebelum upload selesai
    const hasil = await upload(file);
    if (hasil) {
      setPreview(hasil.url);
      onChange(hasil);
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="text-[13px] text-ink-soft block mb-1">
        Foto Aset
      </label>

      {preview ? (
        <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-line">
          <Image
            src={preview}
            alt="Pratinjau foto aset"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("blob:")}
          />
          {uploading && (
            <>
              {/* Foto tetap kelihatan jelas (gak digelapin) — cuma
                  bingkainya yang keisi warna, ngikutin progress upload
                  ASLI (dari xhr.upload.onprogress), bukan animasi kira-kira
                  yang muter terus. pathLength=100 dipakai supaya
                  dasharray/dashoffset gampang dihitung dalam skala 0-100
                  tanpa perlu ngukur keliling rounded-rect manual. */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <rect
                  x="1.5"
                  y="1.5"
                  width="157"
                  height="157"
                  rx="7"
                  fill="none"
                  stroke="var(--color-pine)"
                  strokeWidth="3"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 - progress}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.15s linear" }}
                />
              </svg>
              <div className="absolute bottom-1.5 right-1.5 bg-ink/80 text-white text-[10px] font-medium rounded px-1.5 py-0.5 tabular-nums">
                {progress}%
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-ink"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-40 h-40 rounded-lg border border-dashed border-line flex flex-col items-center justify-center gap-1.5 text-ink-soft hover:border-pine hover:text-pine transition-colors"
        >
          <ImagePlus size={20} />
          <span className="text-[12px]">Unggah foto</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-[12px] text-brick mt-1.5">{error}</p>}
    </div>
  );
}
