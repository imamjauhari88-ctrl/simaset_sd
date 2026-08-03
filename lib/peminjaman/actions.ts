"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfilSaya } from "@/lib/tenant/context";
import { revalidatePath } from "next/cache";

interface RequestBorrowInput {
  assetId: string;
  qty: number;
  tanggalKembaliRencana: string; // ISO date
  catatanPengajuan?: string;
  /** Nama peminjam sebenarnya, kalau beda dari pemilik akun yang login (mis. admin mengajukan atas nama guru tanpa akun). Kosongkan kalau untuk diri sendiri. */
  atasNama?: string;
}

/**
 * A. Request Peminjaman
 * - admin/kepsek → langsung diproses lewat fn_approve_peminjaman (auto-approve/reject)
 * - guru         → insert status MENUNGGU, stok tidak berubah
 *
 * sekolah_id, peminjam_id, dan peminjam_role SENGAJA tidak dikirim dari sini —
 * ketiganya sudah di-default di kolom tabel (current_sekolah_id(), auth.uid(),
 * current_role_app()), jadi tidak ada celah client mengaku identitas/role lain.
 */
export async function requestBorrow(input: RequestBorrowInput) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("UNAUTHENTICATED");

  const supabase = await createClient();

  const { data: peminjaman, error } = await supabase
    .from("peminjaman")
    .insert({
      aset_id: input.assetId,
      qty: input.qty,
      tanggal_kembali_rencana: input.tanggalKembaliRencana,
      catatan_pengajuan: input.catatanPengajuan ?? null,
      atas_nama: input.atasNama?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-approve/reject kalau peminjam adalah admin atau kepsek
  if (profil.role === "admin" || profil.role === "kepsek") {
    const { data: hasil, error: rpcError } = await supabase.rpc(
      "fn_approve_peminjaman",
      { p_borrow_id: peminjaman.borrow_id }
    );
    if (rpcError) throw rpcError;
    revalidatePath("/peminjaman");
    return hasil;
  }

  revalidatePath("/peminjaman");
  return peminjaman;
}

/**
 * B. Approve Peminjaman — hanya admin/kepsek, hanya status MENUNGGU
 */
export async function approveBorrow(borrowId: string) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("UNAUTHENTICATED");
  if (profil.role !== "admin" && profil.role !== "kepsek") {
    throw new Error("FORBIDDEN: hanya admin/kepsek yang boleh approve");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_approve_peminjaman", {
    p_borrow_id: borrowId,
  });
  if (error) throw error;

  revalidatePath("/peminjaman");
  return data;
}

/**
 * D. Reject Peminjaman — hanya admin/kepsek, hanya status MENUNGGU, data tidak dihapus.
 * `note` di-passing ke fn_reject_peminjaman sebagai p_note, disimpan ke kolom
 * alasan_tolak — TERPISAH dari catatan_pengajuan, jadi catatan asli peminjam
 * tidak ketimpa.
 */
export async function rejectBorrow(borrowId: string, note?: string) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("UNAUTHENTICATED");
  if (profil.role !== "admin" && profil.role !== "kepsek") {
    throw new Error("FORBIDDEN: hanya admin/kepsek yang boleh reject");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_reject_peminjaman", {
    p_borrow_id: borrowId,
    p_note: note ?? null,
  });
  if (error) throw error;

  revalidatePath("/peminjaman");
  return data;
}

/**
 * E. Pengembalian Aset — hanya dari status DIPINJAM
 */
export async function returnAsset(borrowId: string) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_return_peminjaman", {
    p_borrow_id: borrowId,
  });
  if (error) throw error;

  revalidatePath("/peminjaman");
  return data;
}
