import { Skeleton, StatCardGridSkeleton, ChartSkeleton } from "@/components/ui/skeleton";

export default function DetailSekolahLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-64" />
      </div>
      <StatCardGridSkeleton count={3} />
      <ChartSkeleton className="h-64" />
    </div>
  );
}
