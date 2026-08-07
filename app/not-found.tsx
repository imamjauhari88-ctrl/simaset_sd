import { NotFoundState } from "@/components/ui/not-found-state";
import { Footer } from "@/components/layout/footer";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <NotFoundState hrefKembali="/" labelKembali="Kembali ke Beranda" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
