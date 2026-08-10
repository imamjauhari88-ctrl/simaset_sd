import { StatCardGridSkeleton, ChartSkeleton } from "@/components/ui/skeleton";

export default function SuperAdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <StatCardGridSkeleton count={4} />
      <ChartSkeleton className="h-72" />
    </div>
  );
}
