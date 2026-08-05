import { Topbar } from "@/components/layout/topbar";
import { LaporanManager } from "@/components/laporan/laporan-manager";
import { getKategoriList, getRuanganList } from "@/lib/supabase/queries";

export default async function LaporanPage() {
  const [kategoriList, ruanganList] = await Promise.all([
    getKategoriList(),
    getRuanganList(),
  ]);

  return (
    <>
      <Topbar title="Laporan" />
      <main className="flex-1 p-6">
        <p className="text-[13px] text-ink-soft mb-4">
          Pilih jenis laporan dan filter (opsional), lalu cetak. Laporan
          dibuka di tab baru — gunakan tombol Cetak di halaman itu untuk
          menyimpan sebagai PDF lewat dialog cetak browser.
        </p>
        <LaporanManager kategoriList={kategoriList} ruanganList={ruanganList} />
      </main>
    </>
  );
}
