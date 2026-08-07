"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Footer } from "@/components/layout/footer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <ErrorState error={error} reset={reset} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
