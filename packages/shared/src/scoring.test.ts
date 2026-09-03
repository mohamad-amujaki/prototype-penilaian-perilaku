import { describe, expect, test } from "bun:test";
import { CANONICAL_EXAMPLE, calculateScores, getCategory } from "./scoring";

describe("calculateScores canonical example", () => {
  const result = calculateScores(CANONICAL_EXAMPLE);

  test("total 24/35 and 82.29", () => {
    expect(result.totalScore).toBe(24);
    expect(result.scoreScale120).toBe(82.29);
    expect(result.kategoriNilaiPerilaku).toBe("Butuh Perbaikan");
  });

  test("per nilai 120", () => {
    expect(result.perNilai120).toEqual({
      "ND-01-BP": 24,
      "ND-02-AK": 48,
      "ND-03-KP": 120,
      "ND-04-HM": 96,
      "ND-05-LY": 72,
      "ND-06-AD": 96,
      "ND-07-KB": 120,
    });
  });

  test("budaya kerja", () => {
    expect(result.budayaEksekusiEfektif).toBe(80);
    expect(result.kategoriEksekusiEfektif).toBe("Butuh Perbaikan");
    expect(result.budayaCaraKerjaBaru).toBe(108);
    expect(result.kategoriCaraKerjaBaru).toBe("Baik");
    expect(result.budayaPelayananUnggul).toBe(60);
    expect(result.kategoriPelayananUnggul).toBe("Kurang");
  });
});

describe("getCategory", () => {
  test("boundaries", () => {
    expect(getCategory(110)).toBe("Sangat Baik");
    expect(getCategory(109.99)).toBe("Baik");
    expect(getCategory(90)).toBe("Baik");
    expect(getCategory(89.99)).toBe("Butuh Perbaikan");
    expect(getCategory(70)).toBe("Butuh Perbaikan");
    expect(getCategory(50)).toBe("Kurang");
    expect(getCategory(49.99)).toBe("Sangat Kurang");
  });
});
