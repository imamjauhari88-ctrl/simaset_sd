"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, Users, Ban, RotateCcw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatWaktuRelatif } from "@/lib/format";
import {
  cariUserGlobal,
  banUserGlobal,
  unbanUserGlobal,
  type UserGlobalRow,
} from "@/app/super-admin/actions";

const PAGE_SIZE = 15;

const LABEL_ROLE: Record<string, string> = {
  admin: "Admin Tenant",
  guru: "Guru/TU",
  kepsek: "Kepala Sekolah",
};

export function TabelUserGlobal({
  dataAwal,
  sekolahList,
}: {
  dataAwal: { data: UserGlobalRow[]; count: number };
  sekolahList: { id: string; nama: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [qInput, setQInput] = useState("");
  const qDebounced = useDebounce(qInput, 400);
  const [sekolahId, setSekolahId] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState(dataAwal.data);
  const [count, setCount] = useState(dataAwal.count);
  const [loading, setLoading] = useState(false);

  const [banTarget, setBanTarget] = useState<UserGlobalRow | null>(null);

  const pertamaKali = useRef(true);

  function muatUlang() {
    setLoading(true);
    return cariUserGlobal({
      q: qDebounced,
      sekolahId,
      role,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((hasil) => {
        setData(hasil.data);
        setCount(hasil.count);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (pertamaKali.current) {
      pertamaKali.current = false;
      return;
    }
    let batal = false;
    setLoading(true);
    cariUserGlobal({ q: qDebounced, sekolahId, role, page, pageSize: PAGE_SIZE })
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
  }, [qDebounced, sekolahId, role, page]);

  function ubahFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  function konfirmasiBan() {
    if (!banTarget) return;
    startTransition(async () => {
      try {
        await banUserGlobal(banTarget.id);
        toast.success(`${banTarget.nama} di-ban`);
        setBanTarget(null);
        await muatUlang();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mem-ban user");
      }
    });
  }

  function unban(u: UserGlobalRow) {
    startTransition(async () => {
      try {
        await unbanUserGlobal(u.id);
        toast.success(`${u.nama} diaktifkan kembali`);
        await muatUlang();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal membatalkan ban");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink-soft flex-1 max-w-sm">
          <Search size={15} />
          <input
            value={qInput}
            onChange={(e) => ubahFilter(() => setQInput(e.target.value))}
            placeholder="Cari nama user..."
            className="bg-transparent outline-none w-full placeholder:text-ink-soft"
          />
        </div>
        <select
          value={sekolahId}
          onChange={(e) => ubahFilter(() => setSekolahId(e.target.value))}
          className="bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Semua sekolah</option>
          {sekolahList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => ubahFilter(() => setRole(e.target.value))}
          className="bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          <option value="">Semua role</option>
          <option value="admin">Admin Tenant</option>
          <option value="guru">Guru/TU</option>
          <option value="kepsek">Kepala Sekolah</option>
        </select>
      </div>

      {data.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title="Gak ada user yang cocok"
          description="Coba ubah kata kunci pencarian atau filter di atas."
        />
      ) : (
        <div className={`tag-card overflow-hidden overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="p-4 font-medium">Nama</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Asal Sekolah</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Login Terakhir</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 text-ink font-medium">{u.nama}</td>
                  <td className="p-4 text-ink-soft">{u.email ?? "—"}</td>
                  <td className="p-4 text-ink-soft">{u.sekolah?.nama ?? "—"}</td>
                  <td className="p-4 text-ink-soft">{LABEL_ROLE[u.role]}</td>
                  <td className="p-4 text-ink-soft">
                    {u.lastSignInAt ? formatWaktuRelatif(u.lastSignInAt) : "Belum pernah login"}
                  </td>
                  <td className="p-4">
                    {u.banned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brick bg-brick-soft px-2.5 py-1 rounded-full w-fit">
                        <ShieldOff size={12} />
                        Di-ban
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage bg-sage-soft px-2.5 py-1 rounded-full w-fit">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.banned ? (
                      <button
                        onClick={() => unban(u)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 text-pine text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-pine-soft transition-colors disabled:opacity-60"
                      >
                        <RotateCcw size={13} />
                        Batalkan Ban
                      </button>
                    ) : (
                      <button
                        onClick={() => setBanTarget(u)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 text-brick text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-line hover:bg-brick-soft transition-colors disabled:opacity-60"
                      >
                        <Ban size={13} />
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} label="user" />
        </div>
      )}

      {banTarget && (
        <Modal title={`Ban ${banTarget.nama}?`} onClose={() => setBanTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-4">
            {banTarget.nama} ({banTarget.email ?? "tanpa email"}) gak akan bisa
            login lagi ke akunnya sampai ban-nya dibatalkan. Terindikasi
            spam/abuse — pastikan dulu sebelum lanjut.
          </p>
          <div className="flex gap-3">
            <button
              onClick={konfirmasiBan}
              disabled={pending}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? "Memproses..." : "Ya, Ban User"}
            </button>
            <button
              onClick={() => setBanTarget(null)}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
