import { Footer } from "@/components/layout/footer";
import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <AuthCard initialMode="login" />
      </main>
      <Footer />
    </div>
  );
}
