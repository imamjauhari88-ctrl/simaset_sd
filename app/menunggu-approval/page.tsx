import { redirect } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/footer";
import { LogoMark } from "@/components/layout/sidebar";
import { logout } from "@/lib/auth/actions";

export default async function MenungguApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profil")
    .select("sekolah:sekolah_id ( nama, status, ditolak_alasan )")
    .eq("id", user.id)
    .maybeSingle();

  const sekolah = (
    profil as unknown as {
      sekolah: { nama: string; status: string; ditolak_alasan: string | null } | null;
    } | null
  )?.sekolah;

  // Sekolahnya udah aktif (mungkin baru aja di-approve) — jangan biarin
  // nyangkut di halaman tunggu, lempar langsung ke dashboard.
  if (sekolah?.status === "aktif") redirect("/dashboard");

  const ditolak = sekolah?.status === "ditolak";

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md tag-card p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <LogoMark size={28} />
            <div className="text-left">
              <p className="font-display font-semibold text-ink">
                SIMASET SD
              </p>
              <p className="text-[11px] text-ink-soft">
                Inventaris Aset Sekolah
              </p>
            </div>
          </div>

          <div
            className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
              ditolak ? "bg-brick-soft text-brick" : "bg-brass-soft text-brass"
            }`}
          >
            {ditolak ? <XCircle size={22} /> : <Clock3 size={22} />}
          </div>

          <p className="font-display font-semibold text-ink text-lg">
            {ditolak ? "Pendaftaran Ditolak" : "Menunggu Persetujuan"}
          </p>
          <p className="text-[13px] text-ink-soft mt-2">
            {ditolak ? (
              <>
                Pendaftaran <span className="font-medium">{sekolah?.nama}</span>{" "}
                gak disetujui.
                {sekolah?.ditolak_alasan && (
                  <>
                    {" "}
                    Alasan: <span className="italic">{sekolah.ditolak_alasan}</span>
                  </>
                )}
                {" "}Hubungi developer kalau ini keliru.
              </>
            ) : (
              <>
                Pendaftaran <span className="font-medium">{sekolah?.nama}</span>{" "}
                lagi ditinjau developer platform. Kamu bakal bisa masuk ke
                dashboard begitu disetujui — biasanya gak lama.
              </>
            )}
          </p>

          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="text-[13px] text-ink-soft hover:text-ink underline"
            >
              Keluar
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
