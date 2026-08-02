"use client";

import { useEffect, useState } from "react";

/**
 * Menunda perubahan `value` selama `delay` ms sebelum diteruskan.
 * Dipakai untuk input pencarian supaya tidak fetch ke server di
 * setiap ketukan tombol — cukup setelah user berhenti mengetik.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
