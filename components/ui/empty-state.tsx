import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="tag-card flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full border border-dashed border-line scale-[1.6]" />
        <div className="relative rounded-full bg-pine-soft text-pine-dark p-3">
          <Icon size={22} />
        </div>
      </div>
      <p className="font-display font-semibold text-ink text-[17px]">
        {title}
      </p>
      <p className="text-ink-soft text-[13px] mt-1 max-w-sm">{description}</p>
      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="mt-5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button className="mt-5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors">
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
