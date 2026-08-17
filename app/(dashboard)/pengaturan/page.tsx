import { Topbar } from "@/components/layout/topbar";
import { UndangPengguna } from "./undang-pengguna";
import { DaftarPengguna } from "./daftar-pengguna";
import { InfoSekolah } from "@/components/pengaturan/info-sekolah";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";
import { getDaftarPengguna } from "@/lib/supabase/queries";

export default async function PengaturanPage() {
  const [profil, sekolah] = await Promise.all([
    getProfilSaya(),
    getSekolahSaya(),
  ]);
  const isAdmin = profil?.role === "admin";
  const daftarPengguna = isAdmin ? await getDaftarPengguna() : [];

  return (
    <>
      <Topbar title="Pengaturan" />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {sekolah && <InfoSekolah sekolah={sekolah} bisaUbah={isAdmin} />}

          {isAdmin && profil ? (
            <div className="space-y-4">
              <UndangPengguna />
              <DaftarPengguna daftar={daftarPengguna} userIdSaya={profil.id} />
            </div>
          ) : (
            <div className="tag-card p-5 text-[13px] text-ink-soft">
              Cuma admin yang bisa mengundang pengguna baru & mengubah
              pengaturan sekolah.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
