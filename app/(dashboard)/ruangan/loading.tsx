import { TopbarSkeleton, ToolbarSkeleton, ItemCardGridSkeleton } from "@/components/ui/skeleton";

export default function RuanganLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <ToolbarSkeleton />
        <ItemCardGridSkeleton count={6} />
      </main>
    </>
  );
}
