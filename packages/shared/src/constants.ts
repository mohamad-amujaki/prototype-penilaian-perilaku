import type { NilaiCode } from "./scoring";

export type Role = "admin" | "assessor" | "employee" | "leadership";

export const NILAI_DASAR: Array<{
  id: string;
  code: NilaiCode;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    id: "nilai_bp",
    code: "BP",
    name: "Berorientasi Pelayanan",
    description:
      "Komitmen memberikan pelayanan prima demi kepuasan masyarakat",
    sortOrder: 1,
  },
  {
    id: "nilai_ak",
    code: "AK",
    name: "Akuntabel",
    description: "Bertanggung jawab atas kepercayaan yang diberikan",
    sortOrder: 2,
  },
  {
    id: "nilai_kp",
    code: "KP",
    name: "Kompeten",
    description: "Terus belajar dan mengembangkan kapabilitas",
    sortOrder: 3,
  },
  {
    id: "nilai_hm",
    code: "HM",
    name: "Harmonis",
    description: "Saling peduli dan menghargai perbedaan",
    sortOrder: 4,
  },
  {
    id: "nilai_ly",
    code: "LY",
    name: "Loyal",
    description:
      "Berdedikasi dan mengutamakan kepentingan bangsa dan negara",
    sortOrder: 5,
  },
  {
    id: "nilai_ad",
    code: "AD",
    name: "Adaptif",
    description:
      "Terus berinovasi dan antusias dalam menggerakkan serta menghadapi perubahan",
    sortOrder: 6,
  },
  {
    id: "nilai_kb",
    code: "KB",
    name: "Kolaboratif",
    description: "Membangun kerja sama yang sinergis",
    sortOrder: 7,
  },
];

export const BARS_LEVELS = [
  { level: 1, name: "Kontraproduktif", description: "Perilaku merugikan organisasi, tidak sesuai nilai" },
  { level: 2, name: "Reaktif Minim Inisiatif", description: "Melakukan tugas dasar dengan minim inisiatif" },
  { level: 3, name: "Sesuai Standar", description: "Memenuhi standar kinerja yang diharapkan" },
  { level: 4, name: "Proaktif Tanpa Diminta", description: "Menunjukkan inisiatif melampaui ekspektasi" },
  { level: 5, name: "Role Model", description: "Menjadi teladan bagi organisasi, dampak luas" },
] as const;

export const BUDAYA_KERJA = [
  { id: "budaya_ee", code: "EE", name: "Eksekusi Efektif" },
  { id: "budaya_ck", code: "CK", name: "Cara Kerja Baru" },
  { id: "budaya_pu", code: "PU", name: "Pelayanan Unggul" },
] as const;

export const CODE_TO_ID: Record<NilaiCode, string> = {
  BP: "nilai_bp",
  AK: "nilai_ak",
  KP: "nilai_kp",
  HM: "nilai_hm",
  LY: "nilai_ly",
  AD: "nilai_ad",
  KB: "nilai_kb",
};

export const ID_TO_CODE: Record<string, NilaiCode> = {
  nilai_bp: "BP",
  nilai_ak: "AK",
  nilai_kp: "KP",
  nilai_hm: "HM",
  nilai_ly: "LY",
  nilai_ad: "AD",
  nilai_kb: "KB",
};
