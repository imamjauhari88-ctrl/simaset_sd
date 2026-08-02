"use client";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  kepsek: "Kepala Sekolah",
};

function inisial(nama: string) {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  nama,
  role,
}: {
  nama: string;
  role: string;
}) {
  return (
    <>
      <div className="hidden sm:block text-right leading-tight">
        <p className="text-[13px] text-ink font-medium">{nama}</p>
        <p className="text-[11px] text-ink-soft">
          {roleLabel[role] ?? role}
        </p>
      </div>

      <div className="w-8 h-8 rounded-full bg-pine text-white text-xs font-medium flex items-center justify-center shrink-0">
        {inisial(nama)}
      </div>
    </>
  );
}
