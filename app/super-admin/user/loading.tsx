import { ToolbarSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function UserGlobalLoading() {
  return (
    <div className="space-y-4">
      <ToolbarSkeleton withSearch />
      <TableSkeleton rows={10} cols={5} />
    </div>
  );
}
