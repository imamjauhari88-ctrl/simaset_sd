"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function SidebarToggleButton() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="text-ink-soft hover:text-ink -ml-1 p-1.5 rounded-lg hover:bg-paper transition-colors"
      aria-label="Buka/tutup menu"
    >
      <Menu size={20} />
    </button>
  );
}
