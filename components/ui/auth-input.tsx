import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Input buat form Login/Onboarding/Undangan — gaya visualnya nyontek
 * referensi desain yang dikasih (background terisi lembut + ikon nempel
 * di kanan, sudut lebih membulat), tapi warnanya tetap pakai token warna
 * aplikasi sendiri (bg-paper/border-line/pine), bukan warna dari
 * referensinya. Logika form (name, required, onChange dst) gak berubah
 * — ini murni pembungkus visual di atas <input> biasa.
 */
export const AuthInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }
>(function AuthInput({ icon: Icon, className, ...props }, ref) {
  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        className={
          "w-full bg-paper border border-transparent rounded-xl pl-4 pr-11 py-3 text-sm text-ink outline-none transition-colors focus:border-pine focus:bg-surface disabled:opacity-60 " +
          (className ?? "")
        }
      />
      <Icon
        size={17}
        strokeWidth={2}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft"
      />
    </div>
  );
});
