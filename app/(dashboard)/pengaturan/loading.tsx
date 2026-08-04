import { TopbarSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function PengaturanLoading() {
  return (
    <>
      <TopbarSkeleton />
      <main className="flex-1 p-6 space-y-4">
        <FormSkeleton fields={4} />
        <FormSkeleton fields={2} />
      </main>
    </>
  );
}
