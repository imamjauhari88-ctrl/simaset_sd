"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const KEY_TEMA = "simaset-tema";

export function ThemeToggle() {
  // `mounted` mencegah mismatch SSR/klien: server nggak tahu preferensi
  // tema tersimpan di localStorage, jadi render awal ikon di-skip dulu
  // sampai komponen ini hydrate di klien.
  const [mounted, setMounted] = useState(false);
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGelap(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const nilaiBaru = !gelap;
    setGelap(nilaiBaru);
    document.documentElement.classList.toggle("dark", nilaiBaru);
    localStorage.setItem(KEY_TEMA, nilaiBaru ? "dark" : "light");
  }

  if (!mounted) {
    return <div className="w-[18px] h-[18px]" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={gelap ? "Mode terang" : "Mode gelap"}
      aria-label="Ganti tema terang/gelap"
      className="text-ink-soft hover:text-ink transition-colors"
    >
      {gelap ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
