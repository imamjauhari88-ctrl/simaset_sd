"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Boxes, Eye } from "lucide-react";
import { KondisiBadge } from "@/components/ui/kondisi-badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatRupiah } from "@/lib/format";
import {
  cariAsetGlobal,
  type AsetGlobalRow,
} from "@/app/super-admin/actions";

const PAGE_SIZE = 15;

export function TabelAsetGlobal({
  dataAwal,
  opsiFilter,
}: {
  dataAwal: { data: AsetGlobalRow[]; count: number };
  opsiFilter: { tenant: { id: string; nama: string }[]; kategoriNama: string[] };
}) {
  const [qInput, setQInput] = useState("");
  const qDebounced = useDebounce(qInput, 400);
  const [sekolahId, setSekolahId] = useState("");
  const [kategoriNama, setKategoriNama] = useState("");
  const [kondisi, setKondisi] = useState("semua");
  const [page, setPage] = useState(1);

  const [data, setData] = useState(dataAwal.data);
  const [count, setCount] = useState(dataAwal.count);
  const [loading, setLoading] = useState(false);

  // Lewatin fetch pertama (data awal udah dikirim dari server component),
  // baru fetch ulang tiap ada perubahan filter/pencarian/halaman setelahnya.
  const pertamaKali = useRef(true);

  useEffect(() => {
    if (pertamaKali.current) {
      pertamaKali.current = false;
      return;
    }
    let batal = false;
    setLoading(true);
    cariAsetGlobal({
      q: qDebounced,
      sekolahId,
      kategoriNama,
      kondisi,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((hasil) => {
        if (batal) return;
        setData(hasil.data);
        setCount(hasil.count);
      })
      .finally(() => {
        if (!batal) setLoading(false);
      });
    return () => {
      batal = true;
    };
  }, [qDebounced, sekolahId, kategoriNama, kondisi, page]);

  // Ganti filter/pencarian → balik ke halaman 1 (bukan nyangkut di
  // halaman lama yang mungkin udah kosong buat hasil filter baru).
  function ubahFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink-soft flex-1 max-w-sm">
          <Search size={15} />
          <input
            value={qInput}
            onChange={(e) => ubahFilter(() => setQInput(e.target.value))}
            placeholder="Cari kode aset, nama, atau merk/tipe..."
            className="bg-transparent outline-none w-full placeholder:text-ink-soft"
          />
        </div>
        <Select
          value={sekolahId}
          onChange={(v) => ubahFilter(() => setSekolahId(v))}
          className="sm:w-48"
          options={[
            { value: "", label: "Semua sekolah" },
            ...opsiFilter.tenant.map((t) => ({ value: t.id, label: t.nama })),
          ]}
        />
        <Select
          value={kategoriNama}
          onChange={(v) => ubahFilter(() => setKategoriNama(v))}
          className="sm:w-48"
          options={[
            { value: "", label: "Semua kategori" },
            ...opsiFilter.kategoriNama.map((k) => ({ value: k, label: k })),
          ]}
        />
        <Select
          value={kondisi}
          onChange={(v) => ubahFilter(() => setKondisi(v))}
          className="sm:w-44"
          options={[
            { value: "semua", label: "Semua status" },
            { value: "baik", label: "Baik" },
            { value: "rusak_ringan", label: "Rusak Ringan" },
            { value: "rusak_berat", label: "Rusak Berat" },
          ]}
        />
      </div>

      {data.length === 0 && !loading ? (
        <EmptyState
          icon={Boxes}
          title="Gak ada aset yang cocok"
          description="Coba ubah kata kunci pencarian atau filter di atas."
        />
      ) : (
        <div className={`tag-card overflow-hidden overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="p-4 font-medium">Kode / Nama Aset</th>
                <th className="p-4 font-medium">Sekolah</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Ruangan</th>
                <th className="p-4 font-medium text-right">Nilai Perolehan</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="p-4">
                    <p className="text-ink font-medium">{a.nama}</p>
                    <p className="text-ink-soft text-[12px] mt-0.5">
                      {a.kode_aset}
                      {a.merk_tipe && ` · ${a.merk_tipe}`}
                    </p>
                  </td>
                  <td className="p-4 text-ink-soft">{a.sekolah?.nama ?? "—"}</td>
                  <td className="p-4 text-ink-soft">{a.kategori?.nama ?? "—"}</td>
                  <td className="p-4 text-ink-soft">{a.ruangan?.nama ?? "—"}</td>
                  <td className="p-4 text-right text-ink-soft">
                    {formatRupiah(a.harga_perolehan)}
                  </td>
                  <td className="p-4">
                    <KondisiBadge kondisi={a.kondisi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} label="aset" />
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[12px] text-ink-soft">
        <Eye size={13} />
        Mode read-only — data aset milik tenant cuma bisa dilihat, gak bisa diedit atau dihapus dari sini.
      </p>
    </div>
  );
}
