/**
 * scoring.perf-test.ts — Performance test untuk mesin kalkulasi skor
 *
 * Memastikan calculateScores berjalan efisien dalam skala besar:
 * - 1.000 kalkulasi < 50ms
 * - 10.000 kalkulasi < 200ms
 * - 100.000 getCategory calls < 50ms
 */

import { describe, expect, test } from "bun:test";
import { CANONICAL_EXAMPLE, calculateScores, getCategory, round2, scoreNilai120 } from "./scoring";

/** Generate skor acak valid (integer 1-5) untuk 7 nilai dasar */
function randomScores() {
  const codes = ["ND-01-BP", "ND-02-AK", "ND-03-KP", "ND-04-HM", "ND-05-LY", "ND-06-AD", "ND-07-KB"] as const;
  const result: Record<string, number> = {};
  for (const code of codes) {
    result[code] = Math.floor(Math.random() * 5) + 1;
  }
  return result as import("./scoring").AssessmentScores;
}

describe("Performance: calculateScores", () => {
  test("1.000 kalkulasi < 50ms", () => {
    const start = performance.now();
    for (let i = 0; i < 1_000; i++) {
      calculateScores(randomScores());
    }
    const elapsed = performance.now() - start;
    console.log(`  1,000 calculateScores: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(50);
  });

  test("10.000 kalkulasi < 200ms", () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      calculateScores(randomScores());
    }
    const elapsed = performance.now() - start;
    console.log(`  10,000 calculateScores: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });

  test("100.000 kalkulasi < 1s", () => {
    const start = performance.now();
    for (let i = 0; i < 100_000; i++) {
      calculateScores(CANONICAL_EXAMPLE);
    }
    const elapsed = performance.now() - start;
    console.log(`  100,000 calculateScores: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("Performance: getCategory", () => {
  test("100.000 calls < 50ms", () => {
    const scores = Array.from({ length: 1000 }, (_, i) => i * 0.13);
    const start = performance.now();
    for (let i = 0; i < 100_000; i++) {
      getCategory(scores[i % scores.length]);
    }
    const elapsed = performance.now() - start;
    console.log(`  100,000 getCategory: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("Performance: round2 + scoreNilai120", () => {
  test("1.000.000 round2 calls < 50ms", () => {
    const start = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      round2(i * 0.00123);
    }
    const elapsed = performance.now() - start;
    console.log(`  1,000,000 round2: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(50);
  });

  test("1.000.000 scoreNilai120 calls < 50ms", () => {
    const start = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      scoreNilai120((i % 5) + 1);
    }
    const elapsed = performance.now() - start;
    console.log(`  1,000,000 scoreNilai120: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("Performance: throughput", () => {
  test("calculateScores throughput > 50.000/sec", () => {
    const iterations = 50_000;
    const scores = CANONICAL_EXAMPLE;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      calculateScores(scores);
    }
    const elapsed = (performance.now() - start) / 1000; // detik
    const throughput = iterations / elapsed;
    console.log(`  Throughput: ${Math.round(throughput).toLocaleString()} kalkulasi/detik`);
    expect(throughput).toBeGreaterThan(50_000);
  });
});
