import type { AktivitasItem } from "@/lib/supabase/queries";

export function ActivityLog({ data }: { data: AktivitasItem[] }) {
  return (
    <div id="aktivitas-terbaru" className="tag-card p-5 scroll-mt-20">
      <p className="font-display font-semibold text-ink mb-4">
        Aktivitas Terbaru
      </p>
      {data.length === 0 ? (
        <p className="text-[13px] text-ink-soft">
          Belum ada aktivitas — mulai tambah aset, catat mutasi, atau
          pemeliharaan.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.map((item) => (
            <li key={item.id} className="flex gap-3 text-[13px]">
              <div className="w-1.5 h-1.5 rounded-full bg-brass mt-1.5 shrink-0" />
              <div>
                <p className="text-ink">{item.teks}</p>
                <p className="text-ink-soft text-[12px] mt-0.5">{item.waktu}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
