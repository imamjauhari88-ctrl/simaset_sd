export type KondisiAset = "baik" | "rusak_ringan" | "rusak_berat";

export type SumberDana = "bos" | "apbd" | "hibah" | "swadaya" | "lainnya";

export type RolePengguna = "admin" | "guru" | "kepsek";

export interface Sekolah {
  id: string;
  nama: string;
  npsn: string | null;
  alamat: string | null;
  logo_url: string | null;
  /** Kode lokasi ala format dinas, mis. "12.13.28.08.07.03.49" —
   * dipakai di kop cetak laporan KIB. */
  kode_lokasi: string | null;
  /** Data penandatangan laporan format dinas — dipakai di blok
   * "Mengetahui, Kepala..." & "Pengurus Barang" tiap laporan cetak. */
  kabupaten_kota: string | null;
  provinsi: string | null;
  kepala_sekolah_nama: string | null;
  kepala_sekolah_nip: string | null;
  pengurus_barang_nama: string | null;
  pengurus_barang_nip: string | null;
  /** Kalau true, laporan Daftar Usulan Barang yang Dihapus dipaksa
   * tampil NIHIL walau ada aset kondisi Rusak Berat. */
  usulan_penghapusan_nihil: boolean;
  /** Tanggal manual buat kop tanda tangan laporan (mis. akhir semester)
   * — kalau null, laporan pakai tanggal hari ini. */
  tanggal_laporan: string | null;
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
  /** Kode klasifikasi resmi dari dinas (beda sama `kode_aset` yang
   * internal aplikasi buat tracking/QR) — dipakai di kolom "Kode
   * Barang" laporan format dinas. */
  kode_barang_dinas: string | null;
  /** Nomor urut per unit barang — dipakai di kolom "Register". */
  nomor_register: string | null;
  /** No.Sertifikat/No.Pabrik/No.Chasis/No.Mesin — 1 kolom gabungan
   * sesuai format Buku Inventaris dinas. */
  no_sertifikat_dll: string | null;
  /** Ukuran Barang/Konstruksi (P,S,D). */
  ukuran_konstruksi: string | null;
  bahan: string | null;
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

export type JenisKib = "A" | "C" | "D" | "E" | "F";

/** Field spesifik per jenis KIB — disimpan longgar (semua optional)
 * karena tiap jenis KIB punya kolom yang beda total. Cuma field yang
 * relevan buat `jenis_kib` baris itu yang diisi, sisanya undefined. */
export interface AsetTetapDetail {
  // KIB A — Tanah
  luas_m2?: string;
  letak_alamat?: string;
  status_hak?: string;
  tanggal_sertifikat?: string;
  no_sertifikat?: string;
  penggunaan?: string;
  asal_usul?: string;
  // KIB C — Gedung dan Bangunan
  kondisi?: "baik" | "kurang_baik" | "rusak_berat";
  bertingkat?: string;
  beton?: string;
  luas_lantai_m2?: string;
  letak_lokasi?: string;
  status_tanah?: string;
  no_kode_tanah?: string;
  // Dokumen (KIB C/D/F) — tanggal & nomor dokumen kepemilikan/perolehan
  dokumen_tanggal?: string;
  dokumen_nomor?: string;
  // KIB D — tambahan
  konstruksi?: string;
  panjang_km?: string;
  lebar_m?: string;
  // KIB E — Aset Tetap Lainnya
  jenis_khusus?: "kesenian_kebudayaan" | "hewan_ternak_tumbuhan" | "buku_perpustakaan" | "lainnya";
  judul_pencipta?: string;
  bahan?: string;
  jumlah?: string;
  // KIB F — Konstruksi Dalam Pengerjaan
  bangunan_psp_d?: "P" | "SP" | "D";
  tgl_bln_thn_tanah?: string;
  asal_usul_pembiayaan?: string;
  nilai_kontrak?: string;
}

export interface AsetTetap {
  id: string;
  sekolah_id: string;
  jenis_kib: JenisKib;
  kode_barang: string | null;
  nomor_register: string | null;
  nama: string;
  tahun: number | null;
  harga: number;
  keterangan: string | null;
  detail: AsetTetapDetail;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
}
