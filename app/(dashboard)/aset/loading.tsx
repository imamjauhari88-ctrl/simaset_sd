import { TopbarSkeleton, ToolbarSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AsetLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <ToolbarSkeleton />
        <TableSkeleton rows={10} cols={6} />
      </main>
    </>
  );
}
