import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/footer";
import { LogoMark } from "@/components/layout/sidebar";
import { logout } from "@/lib/auth/actions";

export default async function AkunNonaktifPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profil")
    .select("sekolah:sekolah_id ( nama, status, alasan_nonaktif )")
    .eq("id", user.id)
    .maybeSingle();

  const sekolah = (
    profil as unknown as {
      sekolah: { nama: string; status: string; alasan_nonaktif: string | null } | null;
    } | null
  )?.sekolah;

  // Sekolahnya udah diaktifkan lagi — jangan biarin nyangkut di sini.
  if (sekolah?.status === "aktif") redirect("/dashboard");

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

          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 bg-brick-soft text-brick">
            <ShieldAlert size={22} />
          </div>

          <p className="font-display font-semibold text-ink text-lg">
            Akun Sekolah Dinonaktifkan
          </p>
          <p className="text-[13px] text-ink-soft mt-2">
            Akses <span className="font-medium">{sekolah?.nama}</span> untuk
            sementara dinonaktifkan oleh developer platform.
            {sekolah?.alasan_nonaktif && (
              <>
                {" "}
                Alasan: <span className="italic">{sekolah.alasan_nonaktif}</span>
              </>
            )}
            {" "}Hubungi developer kalau ini keliru.
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
