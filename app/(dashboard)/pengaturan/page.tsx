import { Topbar } from "@/components/layout/topbar";
import { UndangPengguna } from "./undang-pengguna";
import { InfoSekolah } from "@/components/pengaturan/info-sekolah";
import { getProfilSaya, getSekolahSaya } from "@/lib/tenant/context";

export default async function PengaturanPage() {
  const [profil, sekolah] = await Promise.all([
    getProfilSaya(),
    getSekolahSaya(),
  ]);
  const isAdmin = profil?.role === "admin";

  return (
    <>
      <Topbar title="Pengaturan" />
      <main className="flex-1 p-6 space-y-4">
        {sekolah && <InfoSekolah sekolah={sekolah} />}

        {isAdmin ? (
          <UndangPengguna />
        ) : (
          <div className="tag-card p-5 max-w-xl text-[13px] text-ink-soft">
            Cuma admin yang bisa mengundang pengguna baru & mengubah
            pengaturan sekolah.
          </div>
        )}
      </main>
    </>
  );
}
