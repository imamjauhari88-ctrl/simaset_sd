import Link from "next/link";
import { type LucideIcon, ArrowRight } from "lucide-react";
import clsx from "clsx";

const toneMap = {
  pine: "bg-pine-soft text-pine-dark",
  brass: "bg-brass-soft text-brass",
  sage: "bg-sage-soft text-sage",
  brick: "bg-brick-soft text-brick",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "pine",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneMap;
  href?: string;
}) {
  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] text-ink-soft">{label}</p>
        <p className="font-display text-[26px] font-semibold text-ink mt-1">
          {value}
        </p>
        {hint && (
          <p className="text-[12px] text-ink-soft mt-1 flex items-center gap-1">
            {hint}
            {href && (
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            )}
          </p>
        )}
      </div>
      <div className={clsx("rounded-full p-2.5 transition-transform", toneMap[tone])}>
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="tag-card tag-card-interactive group block p-5 hover:border-pine/40 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="tag-card tag-card-interactive p-5">{content}</div>;
}
