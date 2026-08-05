import { TopbarSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function OpnameLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <div className="tag-card p-6 space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </main>
    </>
  );
}
