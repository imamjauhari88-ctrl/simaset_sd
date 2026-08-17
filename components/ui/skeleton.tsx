import clsx from "clsx";

/** Blok dasar skeleton — pakai token warna yang sama dengan desain app
 *  (bg-line) supaya nyatu di light & dark mode, bukan abu-abu generik. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse rounded-md bg-line/70", className)} />
  );
}

/** Placeholder header yang persis meniru dimensi <Topbar> (h-16, padding,
 *  posisi elemen) biar nggak ada layout shift pas data asli masuk. */
export function TopbarSkeleton() {
  return (
    <header
      className="sticky top-0 z-30 h-16 border-b border-line bg-surface flex items-center justify-between px-4 sm:px-6 gap-3"
      style={{ height: "4rem", minHeight: "4rem" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Skeleton className="hidden lg:block h-8 w-64 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </header>
  );
}

/** Baris tombol aksi di kanan atas halaman list (mis. "Tambah Aset"). */
export function ToolbarSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-2">
        {withSearch && <Skeleton className="h-9 w-48 rounded-lg" />}
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}

/** Tabel dengan header + N baris, mengikuti bentuk tag-card. */
export function TableSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="tag-card overflow-hidden">
      <div className="border-b border-line p-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="p-3.5 flex gap-4 border-b border-line last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={clsx("h-3.5 flex-1", c === 0 && "max-w-24")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** 4 stat card ala Dashboard. */
export function StatCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tag-card p-5 flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Area chart/grafik generik. */
export function ChartSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={clsx("tag-card p-5", className)}>
      <Skeleton className="h-3.5 w-32 mb-4" />
      <Skeleton className="w-full h-[calc(100%-2rem)] rounded-lg" />
    </div>
  );
}

/** Form 2 kolom (label + input) ala FormAset/InfoSekolah. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="tag-card p-6 space-y-5 max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-9 w-28 rounded-lg" />
    </div>
  );
}

/** Grid 3 kolom kartu filter, ala LaporanManager (KIB/KIR/Mutasi). */
export function ReportCardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tag-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Beberapa card ringkas berjejer vertikal — dipakai daftar sesi opname
 *  & tempat lain yang masih list horizontal 1 kolom (bukan grid). */
export function ListCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="tag-card p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Grid kartu per-item (ikon + nama + subjudul + footer angka) — dipakai
 *  manager Kategori Barang & Ruangan/Lokasi yang gaya tampilannya kartu
 *  grid, bukan tabel atau list horizontal. */
export function ItemCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tag-card p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0 pt-0.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-line/60">
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Halaman auth gaya 2-panel (Login/Onboarding/Lupa Sandi/Reset Sandi) —
 *  form skeleton di satu sisi, blok warna solid nutupin sisi PanelBrand
 *  (bukan di-skeleton detail, karena isinya cuma dekoratif/statis, gak
 *  ada data yang beneran "loading"). Ukuran & grid persis nyamain
 *  wrapper asli (max-w-4xl md:h-[560px]) biar gak ada layout shift pas
 *  konten asli masuk. */
export function AuthPanelSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl md:h-[560px] rounded-2xl overflow-hidden border border-line shadow-sm bg-surface grid md:grid-cols-2">
          <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-3 w-56 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
          <div className="order-1 md:order-2 bg-line/40" />
        </div>
      </div>
    </div>
  );
}

/** Halaman 1 kartu di tengah layar (mis. AkunNonaktif) — bukan form,
 *  cuma ikon + teks status, jadi skeleton-nya juga sederhana. */
export function SingleCardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md tag-card p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            <div className="space-y-1.5 text-left">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-40 mx-auto mb-2" />
          <Skeleton className="h-3 w-full mb-1.5" />
          <Skeleton className="h-3 w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
