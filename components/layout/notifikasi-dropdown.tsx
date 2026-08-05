"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Bell, Loader2 } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useAktivitasTerbaru } from "@/lib/queries/aktivitas";

const KEY_TERAKHIR_DILIHAT = "simaset-notif-terakhir-dilihat";

export function NotifikasiDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  const [posisi, setPosisi] = useState<{ top: number; right: number } | null>(
    null
  );
  const tombolRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setBuka(false), buka);

  // Sengaja selalu aktif (bukan cuma pas buka) — badge butuh tahu ada
  // aktivitas baru walau dropdown belum pernah dibuka.
  const { data, isLoading } = useAktivitasTerbaru();

  // Bandingin aktivitas terbaru sama timestamp "terakhir dilihat" yang
  // disimpan di localStorage per-browser. Belum pernah dibuka sama
  // sekali -> anggap semua yang ada belum dibaca (wajar, itu memang
  // belum pernah dilihat user ini).
  const [terakhirDilihat, setTerakhirDilihat] = useState<number>(0);
  useEffect(() => {
    // localStorage cuma ada di klien — gak bisa dibaca saat render awal
    // (SSR), jadi ini SATU-SATUNYA cara baca nilai "terakhir dilihat"
    // tanpa mismatch hydration. Sama kayak pola mount-detection di
    // theme-toggle.tsx, bukan anti-pattern "nyalin state" yang rule ini
    // coba cegah.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerakhirDilihat(
      Number(localStorage.getItem(KEY_TERAKHIR_DILIHAT) ?? 0)
    );
  }, []);

  const adaYangBelumDibaca =
    !!data &&
    data.some(
      (item) => item.waktuRaw && new Date(item.waktuRaw).getTime() > terakhirDilihat
    );

  // Portal-kan dropdown ke <body>, jadi posisinya dihitung manual (fixed)
  // dari posisi tombol bell — tidak lagi bergantung pada `absolute` relatif
  // ke header, yang bisa berantakan kalau header punya sticky/backdrop-filter.
  useLayoutEffect(() => {
    if (!buka || !tombolRef.current) return;

    function hitungPosisi() {
      const rect = tombolRef.current!.getBoundingClientRect();
      setPosisi({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    hitungPosisi();
    window.addEventListener("resize", hitungPosisi);
    window.addEventListener("scroll", hitungPosisi, true);
    return () => {
      window.removeEventListener("resize", hitungPosisi);
      window.removeEventListener("scroll", hitungPosisi, true);
    };
  }, [buka]);

  function bukaDropdown() {
    setBuka((v) => !v);
    // Ditandai "sudah dilihat" begitu dropdown dibuka (bukan nunggu
    // ditutup) — begitu user lihat isinya, badge boleh langsung ilang.
    const sekarang = Date.now();
    localStorage.setItem(KEY_TERAKHIR_DILIHAT, String(sekarang));
    setTerakhirDilihat(sekarang);
  }

  return (
    <>
      <button
        ref={tombolRef}
        onClick={bukaDropdown}
        className="relative text-ink-soft hover:text-ink transition-colors"
        aria-label={
          adaYangBelumDibaca ? "Notifikasi (ada aktivitas baru)" : "Notifikasi"
        }
      >
        <Bell size={19} />
        {adaYangBelumDibaca && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brick ring-2 ring-surface" />
        )}
      </button>

      {buka &&
        posisi &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: posisi.top, right: posisi.right }}
            className="w-80 max-w-[calc(100vw-2rem)] tag-card p-0 overflow-hidden z-40 animate-fade-in"
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="font-display font-semibold text-ink text-[14px]">
                Notifikasi
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-ink-soft">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : !data || data.length === 0 ? (
                <p className="text-[13px] text-ink-soft px-4 py-6 text-center">
                  Belum ada aktivitas terbaru.
                </p>
              ) : (
                <ul>
                  {data.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                    >
                      <p className="text-[13px] text-ink">{item.teks}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5">
                        {item.waktu}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setBuka(false);
                if (pathname === "/dashboard") {
                  // Sudah di halaman ini — Next gak akan "navigasi" sama
                  // sekali kalau cuma hash yang beda dari path yang sama,
                  // jadi scroll manual di sini, gak nunggu apa pun.
                  document
                    .getElementById("aktivitas-terbaru")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  // Dari halaman lain: navigasi penuh, biar #hash-nya
                  // tersimpan di URL — <ScrollToHash /> di halaman Dashboard
                  // yang urus scroll begitu section-nya beneran ke-render
                  // (halaman ini pakai loading.tsx/Suspense, jadi elemen
                  // id="aktivitas-terbaru" belum tentu ada pas Next coba
                  // scroll otomatis pertama kali).
                  router.push("/dashboard#aktivitas-terbaru");
                }
              }}
              className="block w-full text-center text-[12px] text-pine font-medium px-4 py-2.5 border-t border-line hover:bg-paper transition-colors"
            >
              Lihat semua di Dashboard
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
