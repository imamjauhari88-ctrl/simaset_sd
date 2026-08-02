"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { QrScanner } from "@/components/opname/qr-scanner";

export function TombolScanQr({
  onScan,
  label = "Scan QR",
}: {
  onScan: (kode: string) => void;
  label?: string;
}) {
  const [buka, setBuka] = useState(false);

  function handleScan(kode: string) {
    onScan(kode);
    setBuka(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="inline-flex items-center gap-1.5 bg-pine-soft text-pine-dark text-[12px] font-medium pl-2 pr-2.5 py-1 rounded-md hover:bg-pine-soft/70 active:scale-[0.97] transition-all shrink-0"
      >
        <ScanLine size={14} />
        {label}
      </button>

      {buka && (
        <Modal title="Scan Kode QR / Barcode" onClose={() => setBuka(false)}>
          <p className="text-[13px] text-ink-soft mb-4">
            Arahkan kamera ke kode di label barang. Kode yang terbaca otomatis
            keisi ke field.
          </p>
          <QrScanner aktif={buka} onScan={handleScan} />
        </Modal>
      )}
    </>
  );
}
