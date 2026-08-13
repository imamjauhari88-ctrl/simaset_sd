import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { verifikasiTokenUndangan } from "@/lib/tenant/undangan";
import { LogoMark } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PanelBrand } from "@/components/ui/panel-brand";
import { UndanganForm } from "@/components/undangan/undangan-form";

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

  const peran = roleLabel[payload.role] ?? payload.role;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl md:h-[560px] rounded-[28px] overflow-hidden border border-line shadow-xl bg-surface grid md:grid-cols-2">
          <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center animate-book-open-left">
            <div className="flex items-center gap-3 mb-8">
              <LogoMark size={28} />
              <div>
                <p className="font-display font-semibold text-ink">
                  SIMASET SD
                </p>
                <p className="text-[11px] text-ink-soft">
                  Inventaris Aset Sekolah
                </p>
              </div>
            </div>

            <p className="font-display font-semibold text-ink text-lg">
              Gabung ke {sekolah.nama}
            </p>
            <p className="text-[13px] text-ink-soft mt-1 mb-6">
              Kamu diundang sebagai{" "}
              <span className="font-medium text-pine">{peran}</span>. Buat
              akun untuk mulai.
            </p>

            <UndanganForm token={token} />
          </div>

          <div className="order-1 md:order-2 animate-book-open-right">
            <PanelBrand
              title="Selamat Bergabung!"
              description={`Kamu diundang jadi ${peran} di ${sekolah.nama}. Lengkapi datamu di samping buat langsung mulai.`}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
