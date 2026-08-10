import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AnalitikLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-9 w-56 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton className="h-72" />
        <ChartSkeleton className="h-72" />
      </div>
    </div>
  );
}
