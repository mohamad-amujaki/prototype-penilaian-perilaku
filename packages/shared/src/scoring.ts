/**
 * scoring.ts — Mesin kalkulasi skor penilaian perilaku kerja ASN
 *
 * Mengubah 7 skor level (1-5) menjadi:
 * - Total skor mentah (0-35)
 * - Skor skala 120 (standarisasi KemenPANRB)
 * - 3 sub-skor Budaya Kerja (EE, CK, PU)
 * - Kategori penilaian (Sangat Baik s/d Sangat Kurang)
 */

/** Array kode 7 nilai dasar BerAKHLAK */
export const NILAI_CODES = [
  "ND-01-BP", // Berorientasi Pelayanan
  "ND-02-AK", // Akuntabel
  "ND-03-KP", // Kompeten
  "ND-04-HM", // Harmonis
  "ND-05-LY", // Loyal
  "ND-06-AD", // Adaptif
  "ND-07-KB", // Kolaboratif
] as const;

/** Tipe untuk kode nilai dasar (ND-01-BP | ND-02-AK | ... | ND-07-KB) */
export type NilaiCode = (typeof NILAI_CODES)[number];

/**
 * Tipe input penilaian: objek dengan kode nilai sebagai kunci dan level (1-5) sebagai nilai.
 * Contoh: { "ND-01-BP": 3, "ND-02-AK": 4, "ND-03-KP": 5, "ND-04-HM": 3, "ND-05-LY": 4, "ND-06-AD": 2, "ND-07-KB": 3 }
 */
export type AssessmentScores = Record<NilaiCode, number>;

/** Label kategori berdasarkan rentang skor skala 120 */
export type CategoryLabel =
  | "Sangat Baik"      // >= 110
  | "Baik"             // >= 90
  | "Butuh Perbaikan"  // >= 70
  | "Kurang"           // >= 50
  | "Sangat Kurang";   // < 50

/**
 * Membulatkan angka hingga 2 desimal.
 * Digunakan untuk menjaga konsistensi presisi skor.
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Mengkonversi level BARS (1-5) ke skor skala 120.
 * Rumus: (level / 5) × 120
 * Contoh: level 3 → (3/5) × 120 = 72
 */
export function scoreNilai120(level: number): number {
  return round2((level / 5) * 120);
}

/**
 * Menentukan kategori penilaian berdasarkan skor skala 120.
 * Rentang: >=110 Sangat Baik, >=90 Baik, >=70 Butuh Perbaikan, >=50 Kurang, <50 Sangat Kurang
 */
export function getCategory(score: number): CategoryLabel {
  if (score >= 110) return "Sangat Baik";
  if (score >= 90) return "Baik";
  if (score >= 70) return "Butuh Perbaikan";
  if (score >= 50) return "Kurang";
  return "Sangat Kurang";
}

/**
 * Fungsi utama kalkulasi skor penilaian.
 *
 * Menerima 7 level BARS (1-5) dan menghasilkan:
 * 1. totalScore: jumlah mentah semua level (0-35)
 * 2. scoreScale120: skor terstandarisasi skala 120 = (totalScore/35) × 120
 * 3. perNilai120: skor per nilai dasar dalam skala 120
 * 4. 3 dimensi Budaya Kerja (masing-masing dalam skala 0-120)
 * 5. Kategori penilaian untuk setiap skor
 *
 * Rumus Budaya Kerja:
 * - Eksekusi Efektif (EE) = rata-rata(ND-02-AK, ND-03-KP, ND-05-LY) dalam skala 120
 * - Cara Kerja Baru (CK) = rata-rata(ND-06-AD, ND-07-KB) dalam skala 120
 * - Pelayanan Unggul (PU) = rata-rata(ND-01-BP, ND-04-HM) dalam skala 120
 *
 * @throws Error jika ada level di luar rentang 1-5 atau bukan integer
 */
export function calculateScores(input: AssessmentScores) {
  // Validasi: setiap level harus integer antara 1-5
  for (const code of NILAI_CODES) {
    const level = input[code];
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      throw new Error(`Level ${code} harus integer 1-5`);
    }
  }

  // Skor total mentah: jumlah semua level (0-35)
  const totalScore =
    input["ND-01-BP"] +
    input["ND-02-AK"] +
    input["ND-03-KP"] +
    input["ND-04-HM"] +
    input["ND-05-LY"] +
    input["ND-06-AD"] +
    input["ND-07-KB"];

  // Konversi ke skala 120: (total / max 35) × 120
  const scoreScale120 = round2((totalScore / 35) * 120);

  // Kalkulasi 3 dimensi Budaya Kerja
  // EE = rata-rata(AK, KP, LY) → rata-rata dibagi 5 lalu dikali 120
  const budayaEksekusiEfektif = round2(
    ((input["ND-02-AK"] + input["ND-03-KP"] + input["ND-05-LY"]) / 3 / 5) *
      120,
  );
  // CK = rata-rata(AD, KB)
  const budayaCaraKerjaBaru = round2(
    ((input["ND-06-AD"] + input["ND-07-KB"]) / 2 / 5) * 120,
  );
  // PU = rata-rata(BP, HM)
  const budayaPelayananUnggul = round2(
    ((input["ND-01-BP"] + input["ND-04-HM"]) / 2 / 5) * 120,
  );

  return {
    totalScore,
    scoreScale120,
    // Skor per nilai dasar dalam skala 120 (untuk radar chart)
    perNilai120: {
      "ND-01-BP": scoreNilai120(input["ND-01-BP"]),
      "ND-02-AK": scoreNilai120(input["ND-02-AK"]),
      "ND-03-KP": scoreNilai120(input["ND-03-KP"]),
      "ND-04-HM": scoreNilai120(input["ND-04-HM"]),
      "ND-05-LY": scoreNilai120(input["ND-05-LY"]),
      "ND-06-AD": scoreNilai120(input["ND-06-AD"]),
      "ND-07-KB": scoreNilai120(input["ND-07-KB"]),
    },
    budayaEksekusiEfektif,
    budayaCaraKerjaBaru,
    budayaPelayananUnggul,
    kategoriNilaiPerilaku: getCategory(scoreScale120),
    kategoriEksekusiEfektif: getCategory(budayaEksekusiEfektif),
    kategoriCaraKerjaBaru: getCategory(budayaCaraKerjaBaru),
    kategoriPelayananUnggul: getCategory(budayaPelayananUnggul),
  };
}

/**
 * Contoh data penilaian standar untuk pengujian unit.
 * Digunakan di scoring.test.ts untuk memverifikasi benar rumus kalkulasi.
 * Total mentah = 1+2+5+4+3+4+5 = 24, skor skala 120 = (24/35)×120 ≈ 82.29
 */
export const CANONICAL_EXAMPLE: AssessmentScores = {
  "ND-01-BP": 1,
  "ND-02-AK": 2,
  "ND-03-KP": 5,
  "ND-04-HM": 4,
  "ND-05-LY": 3,
  "ND-06-AD": 4,
  "ND-07-KB": 5,
};
