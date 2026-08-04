"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { logout } from "@/lib/auth/actions";

export function TombolKeluarSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
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
        title={collapsed ? "Keluar" : undefined}
        aria-label="Keluar"
        className={clsx(
          "flex items-center gap-3 rounded-lg text-[13px] text-ink-soft hover:bg-brick-soft hover:text-brick transition-colors",
          collapsed ? "w-11 h-11 justify-center" : "w-full px-3 py-2"
        )}
      >
        <LogOut size={16} strokeWidth={1.75} />
        {!collapsed && "Keluar"}
      </button>

      {buka && (
        <Modal title="Keluar dari akun?" onClose={() => setBuka(false)}>
          <p className="text-[13px] text-ink-soft mb-5">
            Kamu perlu login lagi untuk mengakses SIMASET SD setelah keluar.
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
