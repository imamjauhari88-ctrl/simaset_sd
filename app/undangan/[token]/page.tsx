import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { verifikasiTokenUndangan } from "@/lib/tenant/undangan";
import { terimaUndangan } from "./actions";
import { Footer } from "@/components/layout/footer";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  kepsek: "Kepala Sekolah",
};

export default async function UndanganPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = await verifikasiTokenUndangan(token);

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col bg-paper">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="tag-card w-full max-w-md p-8 text-center">
            <p className="font-display font-semibold text-ink text-lg">
              Link Tidak Valid
            </p>
            <p className="text-[13px] text-ink-soft mt-1">
              Undangan ini sudah kedaluwarsa atau salah. Minta admin
              sekolahmu kirim ulang undangan baru.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const service = createServiceClient();
  const { data: sekolah } = await service
    .from("sekolah")
    .select("nama")
    .eq("id", payload.sekolahId)
    .single();

  if (!sekolah) notFound();

  const { data: undangan } = await service
    .from("undangan")
    .select("dipakai_at, kedaluwarsa_at")
    .eq("id", payload.undanganId)
    .maybeSingle();

  const sudahDipakaiAtauKedaluwarsa =
    !undangan ||
    undangan.dipakai_at !== null ||
    new Date(undangan.kedaluwarsa_at) < new Date();

  if (sudahDipakaiAtauKedaluwarsa) {
    return (
      <div className="min-h-screen flex flex-col bg-paper">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="tag-card w-full max-w-md p-8 text-center">
            <p className="font-display font-semibold text-ink text-lg">
              Link Sudah Tidak Berlaku
            </p>
            <p className="text-[13px] text-ink-soft mt-1">
              Undangan ini sudah pernah dipakai untuk mendaftar (satu link
              cuma bisa dipakai sekali) atau sudah kedaluwarsa. Minta admin
              sekolahmu kirim ulang undangan baru.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const submitDenganToken = terimaUndangan.bind(null, token);

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="tag-card w-full max-w-md p-8">
          <p className="font-display font-semibold text-ink text-lg">
            Gabung ke {sekolah.nama}
          </p>
          <p className="text-[13px] text-ink-soft mt-1 mb-6">
            Kamu diundang sebagai{" "}
            <span className="font-medium text-pine">
              {roleLabel[payload.role] ?? payload.role}
            </span>
            . Buat akun untuk mulai.
          </p>

          <form action={submitDenganToken} className="space-y-4">
            <div>
              <label className="text-[13px] text-ink-soft block mb-1">
                Nama Lengkap
              </label>
              <input
                name="nama"
                required
                className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
              />
            </div>
            <div>
              <label className="text-[13px] text-ink-soft block mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
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
                className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors"
            >
              Buat Akun & Gabung
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
