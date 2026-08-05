import { TopbarSkeleton } from "@/components/ui/skeleton";
import {
  Skeleton,
  StatCardGridSkeleton,
  ChartSkeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-6">
        <Skeleton className="h-36 sm:h-40 w-full rounded-2xl" />

        <StatCardGridSkeleton count={4} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <ChartSkeleton />
          </div>
          <div className="xl:col-span-2">
            <ChartSkeleton />
          </div>
        </div>

        <ChartSkeleton />

        <div className="tag-card p-5 space-y-4">
          <Skeleton className="h-4 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
