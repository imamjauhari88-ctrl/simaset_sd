import { TopbarSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function TambahAsetLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6">
        <FormSkeleton fields={8} />
      </main>
    </>
  );
}
