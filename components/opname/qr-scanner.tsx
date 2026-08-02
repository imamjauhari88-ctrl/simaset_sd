"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CameraOff, Loader2 } from "lucide-react";

export function QrScanner({
  aktif,
  onScan,
}: {
  aktif: boolean;
  onScan: (kode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const kodeTerakhirRef = useRef<{ kode: string; waktu: number } | null>(null);

  const [status, setStatus] = useState<"memuat" | "siap" | "ditolak">("memuat");

  useEffect(() => {
    if (!aktif) return;

    let batal = false;

    async function mulaiKamera() {
      setStatus("memuat");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (batal) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("siap");
        loopScan();
      } catch {
        setStatus("ditolak");
      }
    }

    function loopScan() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frameRef.current = requestAnimationFrame(loopScan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        frameRef.current = requestAnimationFrame(loopScan);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const gambar = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const kode = jsQR(gambar.data, gambar.width, gambar.height, {
        inversionAttempts: "dontInvert",
      });

      if (kode?.data) {
        const sekarang = Date.now();
        const terakhir = kodeTerakhirRef.current;
        // Debounce: kode yang sama diabaikan kalau baru discan < 2.5 detik lalu,
        // supaya nggak nembak berkali-kali selama QR masih di depan kamera.
        if (!terakhir || terakhir.kode !== kode.data || sekarang - terakhir.waktu > 2500) {
          kodeTerakhirRef.current = { kode: kode.data, waktu: sekarang };
          onScan(kode.data);
        }
      }

      frameRef.current = requestAnimationFrame(loopScan);
    }

    mulaiKamera();

    return () => {
      batal = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif]);

  if (!aktif) return null;

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-ink">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {status === "siap" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2/3 aspect-square border-2 border-dashed border-paper/70 rounded-xl" />
        </div>
      )}

      {status === "memuat" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-[13px]">Membuka kamera...</p>
        </div>
      )}

      {status === "ditolak" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white px-6 text-center">
          <CameraOff size={24} />
          <p className="text-[13px]">
            Akses kamera ditolak. Izinkan kamera di pengaturan browser lalu
            coba lagi.
          </p>
        </div>
      )}
    </div>
  );
}
