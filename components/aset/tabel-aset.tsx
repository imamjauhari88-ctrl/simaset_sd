"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KondisiBadge } from "@/components/ui/kondisi-badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import type { AsetWithRelasi, DaftarAsetResult } from "@/lib/supabase/queries";
import type { KondisiAset } from "@/types/database";
import { useDaftarAsetPaginated } from "@/lib/queries/aset";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Search, Pencil, ImageOff, QrCode, X } from "lucide-react";
import type { RolePengguna } from "@/types/database";

const PAGE_SIZE = 15;

type ProfilRingkas = { id: string; role: RolePengguna } | null;

/**
 * Aturan boleh-edit: admin bebas ubah semua aset, guru cuma boleh ubah
 * aset yang dia sendiri tambahkan, kepsek selalu read-only (cuma lihat).
 */
function bisaEdit(profil: ProfilRingkas, dibuatOleh: string | null) {
  if (!profil) return false;
  if (profil.role === "admin") return true;
  if (profil.role === "guru") return dibuatOleh === profil.id;
  return false;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function TabelAset({
  initialData,
  profil = null,
}: {
  initialData: DaftarAsetResult;
  profil?: ProfilRingkas;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const kondisi = searchParams.get("kondisi") ?? "semua";
  const qUrl = searchParams.get("q") ?? "";

  // Input pencarian dipisah dari nilai yang dipakai untuk fetch, supaya
  // ketikan user terasa instan sementara request ke server ditunda
  // (debounce) sampai user berhenti mengetik.
  const [qInput, setQInput] = useState(qUrl);
  const qDebounced = useDebounce(qInput, 400);

  const perbaruiUrl = useCallback(
    (perubahan: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(perubahan)) {
        if (value === null || value === "" || value === "semua") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Saat kata kunci (setelah debounce) berubah, sinkronkan ke URL dan
  // reset ke halaman 1 — hasil pencarian baru selalu mulai dari awal.
  useEffect(() => {
    if (qDebounced !== qUrl) {
      perbaruiUrl({ q: qDebounced, page: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    search: qUrl,
    kondisi: kondisi as KondisiAset | "semua",
  };
  const { data, isFetching } = useDaftarAsetPaginated(params, page === 1 && !qUrl && kondisi === "semua" ? initialData : undefined);

  const daftar: AsetWithRelasi[] = data?.data ?? [];
  const total = data?.count ?? 0;

  // Seleksi bulk (checkbox) — sengaja dibatasi per-halaman aja (bukan
  // lintas semua hasil filter), biar sederhana & gak salah nyeret id
  // dari hasil pencarian sebelumnya. Direset tiap ganti halaman/filter.
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  useEffect(() => {
    // Reset seleksi tiap page/filter (dari URL, sistem eksternal) berubah
    // — bukan "copy state" biasa, ini nyegah nyeret id dari hasil query
    // sebelumnya kebawa ke hasil baru. Pola sama kayak topbar-search.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerpilih(new Set());
  }, [page, qUrl, kondisi]);

  function toggleSatu(id: string) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSemua() {
    setTerpilih((prev) =>
      prev.size === daftar.length ? new Set() : new Set(daftar.map((a) => a.id))
    );
  }

  function cetakLabelTerpilih() {
    const params = new URLSearchParams({ ids: Array.from(terpilih).join(",") });
    window.open(`/cetak/aset/pilih?${params}`, "_blank");
  }

  return (
    <div className="tag-card overflow-hidden">
      {/* Garis tipis di atas tabel — nyala pelan saat data lagi disegarkan
          di background, tanpa perlu spinner besar yang ganggu. */}
      <div className="h-0.5 bg-pine-soft overflow-hidden">
        {isFetching && (
          <div className="h-full w-1/3 bg-pine animate-[slide-in-left_1s_ease-in-out_infinite]" />
        )}
      </div>

      {terpilih.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-pine-soft border-b border-line">
          <p className="text-[13px] text-pine-dark font-medium">
            {terpilih.size} aset dipilih
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={cetakLabelTerpilih}
              className="inline-flex items-center gap-1.5 bg-pine text-white text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-pine-dark transition-colors"
            >
              <QrCode size={14} />
              Cetak Label QR Terpilih
            </button>
            <button
              onClick={() => setTerpilih(new Set())}
              className="inline-flex items-center gap-1 text-pine-dark text-[12px] font-medium px-2 py-1.5 rounded-lg hover:bg-surface transition-colors"
            >
              <X size={14} />
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-line">
        <div className="flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-1.5 text-sm w-full sm:w-72 focus-within:border-pine transition-colors">
          <Search size={16} className="text-ink-soft" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Cari kode / nama aset..."
            className="bg-transparent outline-none w-full placeholder:text-ink-soft"
          />
        </div>
        <Select
          size="sm"
          value={kondisi}
          onChange={(v) => perbaruiUrl({ kondisi: v, page: null })}
          className="w-full sm:w-44"
          options={[
            { value: "semua", label: "Semua Kondisi" },
            { value: "baik", label: "Baik" },
            { value: "rusak_ringan", label: "Rusak Ringan" },
            { value: "rusak_berat", label: "Rusak Berat" },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft border-b border-line">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={daftar.length > 0 && terpilih.size === daftar.length}
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        terpilih.size > 0 && terpilih.size < daftar.length;
                  }}
                  onChange={toggleSemua}
                  disabled={daftar.length === 0}
                  aria-label="Pilih semua di halaman ini"
                  className="w-4 h-4 rounded accent-pine cursor-pointer"
                />
              </th>
              <th className="font-medium px-4 py-3 w-12">Foto</th>
              <th className="font-medium px-4 py-3">Kode</th>
              <th className="font-medium px-4 py-3">Nama Aset</th>
              <th className="font-medium px-4 py-3">Kategori</th>
              <th className="font-medium px-4 py-3">Ruangan</th>
              <th className="font-medium px-4 py-3">Tahun</th>
              <th className="font-medium px-4 py-3">Harga Perolehan</th>
              <th className="font-medium px-4 py-3">Kondisi</th>
              <th className="font-medium px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((a) => (
              <tr
                key={a.id}
                className={`border-b border-line last:border-0 hover:bg-paper/70 transition-colors ${
                  terpilih.has(a.id) ? "bg-pine-soft/40" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={terpilih.has(a.id)}
                    onChange={() => toggleSatu(a.id)}
                    aria-label={`Pilih ${a.nama}`}
                    className="w-4 h-4 rounded accent-pine cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-paper border border-line shrink-0 flex items-center justify-center">
                    {a.foto_url ? (
                      <Image
                        src={a.foto_url}
                        alt={a.nama}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={14} className="text-ink-soft/50" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/aset/${a.id}`}
                    className="font-mono text-[12px] text-pine hover:underline underline-offset-2"
                  >
                    {a.kode_aset}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink">{a.nama}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {a.kategori_aset?.nama ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {a.ruangan?.nama ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {a.tahun_perolehan}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {rupiah(a.harga_perolehan)}
                </td>
                <td className="px-4 py-3">
                  <KondisiBadge kondisi={a.kondisi} />
                </td>
                <td className="px-4 py-3 text-right">
                  {bisaEdit(profil, a.dibuat_oleh) && (
                    <Link
                      href={`/aset/${a.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-soft hover:text-pine hover:bg-pine-soft transition-colors"
                      title="Ubah aset"
                      aria-label={`Ubah ${a.nama}`}
                    >
                      <Pencil size={15} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-14 text-center text-ink-soft text-[13px]"
                >
                  {qUrl || kondisi !== "semua" ? (
                    <>
                      <Search size={20} className="mx-auto mb-2 text-line" />
                      Tidak ada aset yang cocok dengan pencarian/filter ini.
                    </>
                  ) : (
                    <>
                      <ImageOff size={20} className="mx-auto mb-2 text-line" />
                      Belum ada aset yang tercatat.
                      <br />
                      <Link
                        href="/aset/tambah"
                        className="text-pine hover:underline font-medium"
                      >
                        Tambah aset pertama
                      </Link>{" "}
                      buat mulai.
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => perbaruiUrl({ page: p === 1 ? null : p })}
        label="aset"
      />
    </div>
  );
}
