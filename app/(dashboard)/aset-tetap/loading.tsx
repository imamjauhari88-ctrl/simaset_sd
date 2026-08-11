import { TopbarSkeleton, Skeleton, ToolbarSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function AsetTetapLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-3.5 w-full max-w-lg" />

        {/* Tab jenis KIB A/C/D/E/F */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg shrink-0" />
          ))}
        </div>

        <ToolbarSkeleton />
        <TableSkeleton rows={5} cols={4} />
      </main>
    </>
  );
}
