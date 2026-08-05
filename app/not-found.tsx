import { NotFoundState } from "@/components/ui/not-found-state";

export default function RootNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <NotFoundState hrefKembali="/" labelKembali="Kembali ke Beranda" />
      </div>
    </main>
  );
}
