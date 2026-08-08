import { ViewTransition } from "react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Footer } from "@/components/layout/footer";
import { PanelBrand } from "@/components/ui/panel-brand";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl md:h-[560px] rounded-2xl overflow-hidden border border-line shadow-sm bg-surface grid md:grid-cols-2 animate-fade-in">
          {/* Panel di KIRI (posisinya sengaja ketuker dari Login yang
              panel-nya di kanan). name="auth-brand" sama persis dengan
              di halaman Login — begitu React ketemu nama yang sama di
              kedua sisi navigasi, posisinya di-morph otomatis sama
              browser (View Transitions API), jadi kerasa "kebuka" pas
              pindah dari/ke Login, bukan reload biasa. */}
          <ViewTransition name="auth-brand">
            <div className="order-1">
              <PanelBrand
                title={user ? "Hampir Selesai!" : "Halo, Selamat Datang!"}
                description={
                  user
                    ? "Akunmu sudah aktif — tinggal lengkapi data sekolah di samping buat mulai."
                    : "Sudah punya akun admin? Gak perlu daftar ulang, langsung masuk aja."
                }
                linkHref={user ? undefined : "/login"}
                linkLabel={user ? undefined : "Masuk"}
              />
            </div>
          </ViewTransition>

          {/* Kartu ini disamain tingginya sama Login (md:h-[560px]) biar
              ukurannya konsisten & gak "loncat" pas pindah halaman. Karena
              formnya lebih panjang, cuma area form ini yang di-scroll
              (judul & deskripsi di atas tetap diam). */}
          <ViewTransition name="auth-form">
            <div className="order-2 p-8 sm:p-10 flex flex-col md:h-full md:overflow-hidden">
              <p className="font-display font-semibold text-ink text-lg">
                Daftarkan Sekolah
              </p>
              <p className="text-[13px] text-ink-soft mt-1 mb-6">
                {user
                  ? "Belum ada sekolah yang terhubung ke akunmu. Isi data di bawah untuk mulai — kamu akan jadi admin pertama."
                  : "Bikin akun sekaligus daftarkan sekolahmu. Kamu akan jadi admin pertama."}
              </p>

              <div className="md:flex-1 md:overflow-y-auto md:pr-1 -mr-1">
                <OnboardingForm sudahLogin={!!user} />
              </div>
            </div>
          </ViewTransition>
        </div>
      </main>
      <Footer />
    </div>
  );
}
