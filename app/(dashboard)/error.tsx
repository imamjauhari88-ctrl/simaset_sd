"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <ErrorState error={error} reset={reset} />
      </div>
    </main>
  );
}
