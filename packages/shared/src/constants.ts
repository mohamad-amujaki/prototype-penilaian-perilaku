/**
 * constants.ts — Konstanta inti untuk sistem Penilaian Perilaku Kerja ASN
 *
 * Berisi definisi 7 Nilai Dasar BerAKHLAK, level BARS, dimensi Budaya Kerja,
 * dan mapping antara kode (ND-01-BP, ND-02-AK, dst.) dengan ID database (nilai_bp, dst.)
 */

import type { NilaiCode } from "./scoring";

/**
 * Tipe peran pengguna dalam sistem.
 * - admin: mengelola periode, pengguna, dan master data
 * - assessor: menilai pegawai binaan
 * - employee: melihat hasil penilaian sendiri
 * - leadership: melihat dashboard agregat per unit
 */
export type Role = "admin" | "assessor" | "employee" | "leadership";

/**
 * Enum untuk level hierarki unit organisasi.
 */
export enum UnitLevel {
  ESELON_1 = "eselon_1",
  UNIT_KERJA = "unit_kerja", // Biro, Pusat, Bagian
  TIM_KERJA = "tim_kerja",
  SEKSI = "seksi",
  LAINNYA = "lainnya",
}

/**
 * Nama tampilan untuk setiap level unit organisasi.
 */
export const UnitLevelDisplayNames: Record<UnitLevel, string> = {
  [UnitLevel.ESELON_1]: "Unit Eselon 1",
  [UnitLevel.UNIT_KERJA]: "Unit Kerja", // Biro, Pusat, Bagian
  [UnitLevel.TIM_KERJA]: "Tim Kerja",
  [UnitLevel.SEKSI]: "Seksi",
  [UnitLevel.LAINNYA]: "Lainnya / UPT",
};

/**
 * 7 Nilai Dasar BerAKHLAK yang menjadi objek penilaian.
 * Setiap nilai memiliki kode (ND-01-BP, ND-02-AK, dst.) yang digunakan di formulir penilaian.
 */
export const NILAI_DASAR: Array<{
  id: string;          // ID unik untuk database (nilai_bp, nilai_ak, dll.)
  code: NilaiCode;     // Kode nilai dasar (ND-01-BP, ND-02-AK, dst.) untuk keperluan UI dan kalkulasi
  name: string;        // Nama lengkap nilai dasar
  description: string; // Deskripsi singkat makna nilai
  sortOrder: number;   // Urutan tampilan (1-7)
}> = [
  {
    id: "nilai_bp",
    code: "ND-01-BP",
    name: "Berorientasi Pelayanan",
    description:
      "Komitmen memberikan pelayanan prima demi kepuasan masyarakat",
    sortOrder: 1,
  },
  {
    id: "nilai_ak",
    code: "ND-02-AK",
    name: "Akuntabel",
    description: "Bertanggung jawab atas kepercayaan yang diberikan",
    sortOrder: 2,
  },
  {
    id: "nilai_kp",
    code: "ND-03-KP",
    name: "Kompeten",
    description: "Terus belajar dan mengembangkan kapabilitas",
    sortOrder: 3,
  },
  {
    id: "nilai_hm",
    code: "ND-04-HM",
    name: "Harmonis",
    description: "Saling peduli dan menghargai perbedaan",
    sortOrder: 4,
  },
  {
    id: "nilai_ly",
    code: "ND-05-LY",
    name: "Loyal",
    description:
      "Berdedikasi dan mengutamakan kepentingan bangsa dan negara",
    sortOrder: 5,
  },
  {
    id: "nilai_ad",
    code: "ND-06-AD",
    name: "Adaptif",
    description:
      "Terus berinovasi dan antusias dalam menggerakkan serta menghadapi perubahan",
    sortOrder: 6,
  },
  {
    id: "nilai_kb",
    code: "ND-07-KB",
    name: "Kolaboratif",
    description: "Membangun kerja sama yang sinergis",
    sortOrder: 7,
  },
];

/**
 * 5 Level BARS (Behaviorally Anchored Rating Scale).
 * Digunakan sebagai skala penilaian untuk setiap nilai dasar.
 * Level 1 = terendah (kontraproduktif), Level 5 = tertinggi (role model).
 */
export const BARS_LEVELS = [
  { level: 1, name: "Kontraproduktif", description: "Perilaku merugikan organisasi, tidak sesuai nilai" },
  { level: 2, name: "Reaktif Minim Inisiatif", description: "Melakukan tugas dasar dengan minim inisiatif" },
  { level: 3, name: "Sesuai Standar", description: "Memenuhi standar perilaku yang diharapkan" },
  { level: 4, name: "Proaktif Tanpa Diminta", description: "Menunjukkan inisiatif melampaui ekspektasi" },
  { level: 5, name: "Role Model", description: "Menjadi teladan bagi organisasi, dampak luas" },
] as const;

/**
 * 3 Dimensi Budaya Kerja yang dihitung dari 7 nilai dasar.
 * Masing-masing dimensi merupakan gabungan dari beberapa nilai dasar:
 * - Budaya 01 (Eksekusi Efektif) = rata-rata Akuntabel, Kompeten, Loyal
 * - Budaya 02 (Cara Kerja Baru) = rata-rata Adaptif, Kolaboratif
 * - Budaya 03 (Pelayanan Unggul) = rata-rata Berorientasi Pelayanan, Harmonis
 */
export const BUDAYA_KERJA = [
  { id: "budaya_ee", code: "BK-01-EE", name: "Eksekusi Efektif" },
  { id: "budaya_ck", code: "BK-02-CK", name: "Cara Kerja Baru" },
  { id: "budaya_pu", code: "BK-03-PU", name: "Pelayanan Unggul" },
] as const;

/** Mapping kode nilai dasar (ND-01-BP, ND-02-AK, dst.) ke ID database (nilai_bp, nilai_ak, dst.) */
export const CODE_TO_ID: Record<NilaiCode, string> = {
  "ND-01-BP": "nilai_bp",
  "ND-02-AK": "nilai_ak",
  "ND-03-KP": "nilai_kp",
  "ND-04-HM": "nilai_hm",
  "ND-05-LY": "nilai_ly",
  "ND-06-AD": "nilai_ad",
  "ND-07-KB": "nilai_kb",
};

/** Mapping ID database ke kode nilai dasar (kebalikan dari CODE_TO_ID) */
export const ID_TO_CODE: Record<string, NilaiCode> = {
  nilai_bp: "ND-01-BP",
  nilai_ak: "ND-02-AK",
  nilai_kp: "ND-03-KP",
  nilai_hm: "ND-04-HM",
  nilai_ly: "ND-05-LY",
  nilai_ad: "ND-06-AD",
  nilai_kb: "ND-07-KB",
};
