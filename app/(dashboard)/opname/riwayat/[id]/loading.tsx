import { TopbarSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DetailRiwayatOpnameLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-9 w-52 rounded-lg" />
        <TableSkeleton rows={8} cols={5} />
      </main>
    </>
  );
}
