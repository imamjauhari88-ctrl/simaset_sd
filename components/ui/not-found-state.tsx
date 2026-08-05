import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

/** UI generik buat not-found.tsx di berbagai segment — konsisten sama
 *  gaya ErrorState (tag-card, ikon bulat dashed) tapi nada netral
 *  (bukan "brick"/brick-soft) karena ini bukan kegagalan sistem, cuma
 *  data/URL yang emang gak ada. */
export function NotFoundState({
  title = "Halaman tidak ditemukan",
  description = "URL yang kamu buka mungkin salah ketik, sudah dipindah, atau datanya sudah dihapus.",
  hrefKembali = "/dashboard",
  labelKembali = "Kembali ke Dashboard",
}: {
  title?: string;
  description?: string;
  hrefKembali?: string;
  labelKembali?: string;
}) {
  return (
    <div className="tag-card flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full border border-dashed border-line scale-[1.6]" />
        <div className="relative rounded-full bg-paper text-ink-soft p-3">
          <SearchX size={22} />
        </div>
      </div>
      <p className="font-display font-semibold text-ink text-[17px]">{title}</p>
      <p className="text-ink-soft text-[13px] mt-1 max-w-sm">{description}</p>
      <Link
        href={hrefKembali}
        className="mt-5 inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
      >
        <ArrowLeft size={15} />
        {labelKembali}
      </Link>
    </div>
  );
}
