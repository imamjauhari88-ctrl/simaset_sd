import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/footer";
import { AuthCard } from "@/components/auth/auth-card";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <AuthCard initialMode="onboarding" sudahLogin={!!user} />
      </main>
      <Footer />
    </div>
  );
}
