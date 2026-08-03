"use client";

import { createContext, useContext, useState } from "react";

interface SidebarContextValue {
  isMobileOpen: boolean;
  isDesktopOpen: boolean;
  toggle: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        isDesktopOpen,
        // Satu tombol burger dipakai di mobile & desktop. Di layar masing-masing
        // cuma satu state yang berpengaruh secara visual (drawer mobile disembunyikan
        // lewat class md:hidden, aside desktop disembunyikan lewat class hidden md:flex),
        // jadi aman untuk toggle keduanya sekaligus tanpa perlu deteksi breakpoint.
        toggle: () => {
          setIsMobileOpen((v) => !v);
          setIsDesktopOpen((v) => !v);
        },
        closeMobile: () => setIsMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar harus dipakai di dalam SidebarProvider");
  return ctx;
}
