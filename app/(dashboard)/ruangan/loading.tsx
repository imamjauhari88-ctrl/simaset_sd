import { TopbarSkeleton, ToolbarSkeleton, ListCardSkeleton } from "@/components/ui/skeleton";

export default function RuanganLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <ToolbarSkeleton />
        <ListCardSkeleton count={6} />
      </main>
    </>
  );
}
