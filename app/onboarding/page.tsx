import { createClient } from "@/lib/supabase/server";
import { buatSekolahBaru } from "./actions";

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

        <form action={buatSekolahBaru} className="space-y-4">
          {!user && (
            <>
              <div>
                <label className="text-[13px] text-ink-soft block mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
                />
              </div>
              <div>
                <label className="text-[13px] text-ink-soft block mb-1">
                  Kata Sandi
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
                />
              </div>
              <hr className="border-line" />
            </>
          )}

          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Nama Kamu
            </label>
            <input
              name="nama_admin"
              required
              placeholder="mis. Sri Wahyuni"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Nama Sekolah
            </label>
            <input
              name="nama"
              required
              placeholder="mis. UPTD SDN Tamansareh 2"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              NPSN <span className="text-ink-soft/70">(opsional)</span>
            </label>
            <input
              name="npsn"
              placeholder="20xxxxxx"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Alamat <span className="text-ink-soft/70">(opsional)</span>
            </label>
            <textarea
              name="alamat"
              rows={2}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors"
          >
            Buat Sekolah & Masuk Dashboard
          </button>
        </form>

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
