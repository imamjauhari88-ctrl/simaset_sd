"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const KEY_TEMA = "simaset-tema";

export function ThemeToggle() {
  // `mounted` mencegah mismatch SSR/klien: server nggak tahu preferensi
  // tema tersimpan di localStorage, jadi render awal ikon di-skip dulu
  // sampai komponen ini hydrate di klien.
  // Digabung jadi satu state object (bukan dua useState terpisah) supaya
  // effect di bawah cuma nge-trigger SATU render ekstra saat hydrate,
  // bukan dua render berantai (react-hooks/set-state-in-effect).
  const [state, setState] = useState({ mounted: false, gelap: false });

  useEffect(() => {
    // Pola "mounted" ini sengaja baca document di dalam effect: satu-satunya
    // cara aman baca preferensi tema tersimpan (DOM/localStorage) tanpa bikin
    // mismatch SSR-vs-klien. Bukan anti-pattern "effect nyalin state" biasa
    // yang react-hooks/set-state-in-effect coba cegah, jadi rule-nya
    // di-disable khusus baris ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      mounted: true,
      gelap: document.documentElement.classList.contains("dark"),
    });
  }, []);

  const { mounted, gelap } = state;

  function setGelap(nilai: boolean) {
    setState((s) => ({ ...s, gelap: nilai }));
  }

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
