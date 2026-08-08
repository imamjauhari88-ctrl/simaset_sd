"use client";

import { useMemo, useState } from "react";
import { Clock3, CheckCircle2, XCircle, Search } from "lucide-react";
import { DaftarSekolahPending } from "./daftar-sekolah-pending";
import { DaftarSekolahAktif } from "./daftar-sekolah-aktif";
import { DaftarSekolahDitolak } from "./daftar-sekolah-ditolak";
import type { SekolahUntukSuperAdmin } from "@/lib/queries/super-admin";

type TabKey = "menunggu" | "aktif" | "ditolak";

const TABS: {
  key: TabKey;
  label: string;
  icon: typeof Clock3;
  activeClass: string;
}[] = [
  {
    key: "menunggu",
    label: "Menunggu",
    icon: Clock3,
    activeClass: "ring-2 ring-brass bg-brass-soft",
  },
  {
    key: "aktif",
    label: "Aktif",
    icon: CheckCircle2,
    activeClass: "ring-2 ring-sage bg-sage-soft",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    icon: XCircle,
    activeClass: "ring-2 ring-brick bg-brick-soft",
  },
];

export function SuperAdminTabs({
  pending,
  aktif,
  ditolak,
}: {
  pending: SekolahUntukSuperAdmin[];
  aktif: SekolahUntukSuperAdmin[];
  ditolak: SekolahUntukSuperAdmin[];
}) {
  const [tab, setTab] = useState<TabKey>(pending.length > 0 ? "menunggu" : "aktif");
  const [cari, setCari] = useState("");

  const semua = { menunggu: pending, aktif, ditolak };
  const daftarAktifTab = semua[tab];

  // Filter nama/NPSN client-side — daftar sekolah biasanya gak akan
  // sampai ribuan baris, jadi gak perlu query ulang ke server tiap ketik.
  const hasilFilter = useMemo(() => {
    if (!cari.trim()) return daftarAktifTab;
    const q = cari.toLowerCase();
    return daftarAktifTab.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.npsn?.toLowerCase().includes(q) ||
        s.admin?.nama.toLowerCase().includes(q)
    );
  }, [daftarAktifTab, cari]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {TABS.map((t) => {
          const Icon = t.icon;
          const aktifTab = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tag-card p-4 text-center transition-all ${
                aktifTab ? t.activeClass : "hover:bg-paper"
              }`}
            >
              <Icon
                size={16}
                className={`mx-auto mb-1.5 ${
                  aktifTab ? "text-ink" : "text-ink-soft"
                }`}
              />
              <p className="font-display text-xl font-semibold text-ink">
                {semua[t.key].length}
              </p>
              <p className="text-[11px] text-ink-soft mt-0.5">{t.label}</p>
            </button>
          );
        })}
      </div>

      {daftarAktifTab.length > 3 && (
        <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink-soft max-w-sm">
          <Search size={15} />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama sekolah, NPSN, atau admin..."
            className="bg-transparent outline-none w-full placeholder:text-ink-soft"
          />
        </div>
      )}

      {tab === "menunggu" && <DaftarSekolahPending daftar={hasilFilter} />}
      {tab === "aktif" && <DaftarSekolahAktif daftar={hasilFilter} />}
      {tab === "ditolak" && <DaftarSekolahDitolak daftar={hasilFilter} />}
    </div>
  );
}
