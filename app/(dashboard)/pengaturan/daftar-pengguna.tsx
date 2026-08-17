"use client";

import { useState, useTransition } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ubahRolePengguna, cabutAksesPengguna } from "./actions";
import type { Profil, RolePengguna } from "@/types/database";

const ROLE_LABEL: Record<RolePengguna, string> = {
  admin: "Admin",
  guru: "Guru",
  kepsek: "Kepala Sekolah",
};

const ROLE_BADGE: Record<RolePengguna, string> = {
  admin: "bg-pine-soft text-pine-dark",
  guru: "bg-sage-soft text-sage",
  kepsek: "bg-brass-soft text-brass",
};

export function DaftarPengguna({
  daftar,
  userIdSaya,
}: {
  daftar: Profil[];
  userIdSaya: string;
}) {
  const [pending, startTransition] = useTransition();
  const [cabutTarget, setCabutTarget] = useState<Profil | null>(null);

  function handleUbahRole(id: string, roleBaru: RolePengguna) {
    startTransition(async () => {
      try {
        await ubahRolePengguna(id, roleBaru);
        toast.success("Role pengguna diubah");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mengubah role");
      }
    });
  }

  function konfirmasiCabut() {
    if (!cabutTarget) return;
    startTransition(async () => {
      try {
        await cabutAksesPengguna(cabutTarget.id);
        toast.success(`Akses ${cabutTarget.nama} dicabut`);
        setCabutTarget(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mencabut akses");
      }
    });
  }

  return (
    <div className="tag-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users size={18} className="text-pine" />
        <p className="font-display font-semibold text-ink">
          Pengguna ({daftar.length})
        </p>
      </div>
      <p className="text-[13px] text-ink-soft mb-4">
        Semua akun yang tergabung di sekolahmu. Role admin gak bisa
        dipindahkan lewat sini — cuma ada satu admin per sekolah.
      </p>

      <ul className="divide-y divide-line">
        {daftar.map((p) => {
          const diriSendiri = p.id === userIdSaya;
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] text-ink font-medium truncate">
                  {p.nama}
                  {diriSendiri && (
                    <span className="text-ink-soft font-normal"> (Kamu)</span>
                  )}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE[p.role]}`}
                >
                  {p.role === "admin" && <ShieldCheck size={11} />}
                  {ROLE_LABEL[p.role]}
                </span>
              </div>

              {!diriSendiri && p.role !== "admin" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    size="sm"
                    value={p.role}
                    disabled={pending}
                    onChange={(v) => handleUbahRole(p.id, v as RolePengguna)}
                    className="w-40"
                    options={[
                      { value: "guru", label: "Guru" },
                      { value: "kepsek", label: "Kepala Sekolah" },
                    ]}
                  />
                  <button
                    onClick={() => setCabutTarget(p)}
                    disabled={pending}
                    className="text-[12px] text-brick hover:underline disabled:opacity-60"
                  >
                    Cabut Akses
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {cabutTarget && (
        <Modal title="Cabut Akses Pengguna?" onClose={() => setCabutTarget(null)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Yakin mau cabut akses{" "}
            <span className="font-medium text-ink">{cabutTarget.nama}</span>{" "}
            dari sekolah ini? Dia gak akan bisa lihat/ubah data sekolahmu
            lagi, tapi akunnya tetap ada (bisa diundang lagi kapan pun kalau
            perlu).
          </p>
          <div className="flex gap-3">
            <button
              onClick={konfirmasiCabut}
              disabled={pending}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {pending ? "Memproses..." : "Ya, Cabut Akses"}
            </button>
            <button
              onClick={() => setCabutTarget(null)}
              className="text-ink-soft text-sm px-4 py-2 rounded-lg hover:bg-paper transition-colors"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
