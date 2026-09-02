export const NILAI_CODES = ["BP", "AK", "KP", "HM", "LY", "AD", "KB"] as const;
export type NilaiCode = (typeof NILAI_CODES)[number];

export type AssessmentScores = Record<NilaiCode, number>;

export type CategoryLabel =
  | "Sangat Baik"
  | "Baik"
  | "Butuh Perbaikan"
  | "Kurang"
  | "Sangat Kurang";

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function scoreNilai120(level: number): number {
  return round2((level / 5) * 120);
}

export function getCategory(score: number): CategoryLabel {
  if (score >= 110) return "Sangat Baik";
  if (score >= 90) return "Baik";
  if (score >= 70) return "Butuh Perbaikan";
  if (score >= 50) return "Kurang";
  return "Sangat Kurang";
}

export function calculateScores(input: AssessmentScores) {
  for (const code of NILAI_CODES) {
    const level = input[code];
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      throw new Error(`Level ${code} harus integer 1-5`);
    }
  }

  const totalScore =
    input.BP + input.AK + input.KP + input.HM + input.LY + input.AD + input.KB;
  const scoreScale120 = round2((totalScore / 35) * 120);
  const budayaEksekusiEfektif = round2(
    ((input.AK + input.KP + input.LY) / 3 / 5) * 120,
  );
  const budayaCaraKerjaBaru = round2(((input.AD + input.KB) / 2 / 5) * 120);
  const budayaPelayananUnggul = round2(
    ((input.BP + input.HM) / 2 / 5) * 120,
  );

  return {
    totalScore,
    scoreScale120,
    perNilai120: {
      BP: scoreNilai120(input.BP),
      AK: scoreNilai120(input.AK),
      KP: scoreNilai120(input.KP),
      HM: scoreNilai120(input.HM),
      LY: scoreNilai120(input.LY),
      AD: scoreNilai120(input.AD),
      KB: scoreNilai120(input.KB),
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

export const CANONICAL_EXAMPLE: AssessmentScores = {
  BP: 1,
  AK: 2,
  KP: 5,
  HM: 4,
  LY: 3,
  AD: 4,
  KB: 5,
};
