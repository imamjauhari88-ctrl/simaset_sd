import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function SekolahLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
