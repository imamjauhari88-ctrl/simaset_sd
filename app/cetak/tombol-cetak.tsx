"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function TombolCetak() {
  const router = useRouter();

  return (
    <div className="print:hidden flex items-center gap-3 mb-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-ink-soft text-sm hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors ml-auto"
      >
        <Printer size={16} />
        Cetak
      </button>
    </div>
  );
}
