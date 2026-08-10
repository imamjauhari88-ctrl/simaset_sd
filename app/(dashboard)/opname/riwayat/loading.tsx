import { TopbarSkeleton, Skeleton, ListCardSkeleton } from "@/components/ui/skeleton";

export default function RiwayatOpnameLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <ListCardSkeleton count={5} />
      </main>
    </>
  );
}
