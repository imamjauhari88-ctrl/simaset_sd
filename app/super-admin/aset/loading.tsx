import { ToolbarSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AsetGlobalLoading() {
  return (
    <div className="space-y-4">
      <ToolbarSkeleton withSearch />
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
