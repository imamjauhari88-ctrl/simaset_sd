export type KondisiAset = "baik" | "rusak_ringan" | "rusak_berat";

export type SumberDana = "bos" | "apbd" | "hibah" | "swadaya" | "lainnya";

export type RolePengguna = "admin" | "guru" | "kepsek";

export interface Sekolah {
  id: string;
  nama: string;
  npsn: string | null;
  alamat: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Profil {
  id: string; // = auth.users.id
  sekolah_id: string;
  nama: string;
  role: RolePengguna;
  created_at: string;
}

export interface Undangan {
  id: string;
  sekolah_id: string;
  role: RolePengguna;
  dibuat_oleh: string | null;
  kedaluwarsa_at: string;
  dipakai_at: string | null;
  dipakai_oleh: string | null;
  created_at: string;
}

export interface KategoriAset {
  id: string;
  sekolah_id: string;
  nama: string;
  kode_kib: string | null; // Kartu Inventaris Barang A-F
  created_at: string;
}

export interface Ruangan {
  id: string;
  sekolah_id: string;
  nama: string;
  keterangan: string | null;
  created_at: string;
}

export interface Aset {
  id: string;
  sekolah_id: string;
  kode_aset: string;
  nama: string;
  kategori_id: string;
  ruangan_id: string;
  merk_tipe: string | null;
  tahun_perolehan: number;
  sumber_dana: SumberDana;
  harga_perolehan: number;
  kondisi: KondisiAset;
  stok: number;
  foto_url: string | null;
  foto_public_id: string | null;
  catatan: string | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
}

export interface MutasiAset {
  id: string;
  aset_id: string;
  ruangan_asal_id: string;
  ruangan_tujuan_id: string;
  tanggal: string;
  disetujui_oleh: string | null;
  keterangan: string | null;
  created_at: string;
}

export interface PemeliharaanAset {
  id: string;
  aset_id: string;
  tanggal: string;
  jenis: "rutin" | "perbaikan";
  biaya: number | null;
  keterangan: string | null;
  disetujui_oleh: string | null;
  created_at: string;
}

export type StatusPeminjaman = "MENUNGGU" | "DIPINJAM" | "DITOLAK" | "DIKEMBALIKAN";
export type TipeTransaksiLog = "APPROVE" | "REJECT" | "RETURN";

export interface Peminjaman {
  borrow_id: string;
  sekolah_id: string;
  aset_id: string;
  peminjam_id: string;
  peminjam_role: RolePengguna;
  qty: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  status: StatusPeminjaman;
  approver_id: string | null;
  // Catatan peminjam saat mengajukan (mis. "keperluan rapat wali murid").
  // Ditulis sekali saat insert, tidak pernah ditimpa lagi.
  catatan_pengajuan: string | null;
  // Alasan admin/kepsek menolak. Cuma diisi fn_reject_peminjaman saat
  // status jadi DITOLAK — terpisah dari catatan_pengajuan di atas.
  alasan_tolak: string | null;
  // Nama peminjam SEBENARNYA kalau beda dari pemilik akun (mis. diajukan
  // admin atas nama guru yang tidak punya akun). null = pakai nama akun.
  atas_nama: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransaksiLog {
  id: string;
  sekolah_id: string;
  timestamp: string;
  type: TipeTransaksiLog;
  borrow_id: string;
  aset_id: string;
  qty: number;
  before_stock: number;
  after_stock: number;
  actor_id: string;
  note: string | null;
}

export type StatusOpname = "berlangsung" | "selesai";

export interface OpnameSesi {
  id: string;
  sekolah_id: string;
  judul: string;
  status: StatusOpname;
  dibuat_oleh: string | null;
  created_at: string;
  selesai_at: string | null;
}

export interface OpnameDetail {
  id: string;
  sekolah_id: string;
  sesi_id: string;
  aset_id: string;
  kondisi_saat_opname: KondisiAset | null;
  catatan: string | null;
  di_scan_oleh: string | null;
  created_at: string;
}
