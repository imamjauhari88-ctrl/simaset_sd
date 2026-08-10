import { TopbarSkeleton, Skeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function TambahAsetMassalLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <FormSkeleton fields={7} />
      </main>
    </>
  );
}
