"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { logout } from "@/lib/auth/actions";

export function TombolKeluarSuperAdmin() {
  const [buka, setBuka] = useState(false);
  const [sedangKeluar, startTransition] = useTransition();

  function konfirmasi() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="text-[13px] text-ink-soft hover:text-ink"
      >
        Keluar
      </button>

      {buka && (
        <Modal title="Keluar dari akun?" onClose={() => setBuka(false)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Kamu perlu login lagi untuk mengakses panel Super Admin setelah
            keluar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={konfirmasi}
              disabled={sedangKeluar}
              className="bg-brick text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {sedangKeluar ? "Keluar..." : "Ya, Keluar"}
            </button>
            <button
              onClick={() => setBuka(false)}
              disabled={sedangKeluar}
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
