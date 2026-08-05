import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="tag-card w-full max-w-md p-8">
        <p className="font-display font-semibold text-ink text-lg">
          Daftarkan Sekolah
        </p>
        <p className="text-[13px] text-ink-soft mt-1 mb-6">
          {user
            ? "Belum ada sekolah yang terhubung ke akunmu. Isi data di bawah untuk mulai — kamu akan jadi admin pertama."
            : "Bikin akun sekaligus daftarkan sekolahmu. Kamu akan jadi admin pertama."}
        </p>

        <OnboardingForm sudahLogin={!!user} />

        {!user && (
          <p className="text-[12px] text-ink-soft text-center mt-5">
            Sudah punya akun?{" "}
            <a href="/login" className="text-pine hover:underline">
              Masuk di sini
            </a>
            .
          </p>
        )}
      </div>
    </main>
  );
}
