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

/** Beberapa card ringkas berjejer vertikal, ala manager kategori/ruangan
 *  atau daftar sesi opname. */
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
