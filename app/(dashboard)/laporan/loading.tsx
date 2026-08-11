import { TopbarSkeleton, Skeleton, ReportCardGridSkeleton } from "@/components/ui/skeleton";

export default function LaporanLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-3.5 w-full max-w-lg" />
        <ReportCardGridSkeleton count={7} />
      </main>
    </>
  );
}
