import { TopbarSkeleton, ToolbarSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function PeminjamanLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <ToolbarSkeleton withSearch />
        <TableSkeleton rows={8} cols={5} />
      </main>
    </>
  );
}
