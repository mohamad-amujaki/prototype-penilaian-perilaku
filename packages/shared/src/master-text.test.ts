/**
 * master-text.test.ts — Unit test untuk teks referensi BerAKHLAK
 *
 * Memvalidasi:
 * - PANDUAN: 21 pedoman (3 per 7 nilai dasar), tidak duplikat
 * - ANCHORS: 35 jangkar (5 per 7 nilai dasar), setiap array length=5
 * - FEEDBACKS: 35 template (5 per 7 nilai dasar), setiap array length=5
 */

import { describe, expect, test } from "bun:test";
import { ANCHORS, FEEDBACKS, PANDUAN } from "./master-text";
import { NILAI_CODES } from "./scoring";

const NILAI_IDS = ["nilai_bp", "nilai_ak", "nilai_kp", "nilai_hm", "nilai_ly", "nilai_ad", "nilai_kb"];

describe("PANDUAN", () => {
  test("jumlah pedoman = 21 (3 per 7 nilai dasar)", () => {
    expect(PANDUAN.length).toBe(21);
  });

  test("setiap nilai dasar punya tepat 3 pedoman", () => {
    for (const id of NILAI_IDS) {
      const items = PANDUAN.filter((p) => p.nilaiDasarId === id);
      expect(items.length).toBe(3);
    }
  });

  test("sequence 1-3 untuk setiap nilai dasar", () => {
    for (const id of NILAI_IDS) {
      const items = PANDUAN.filter((p) => p.nilaiDasarId === id);
      const sequences = items.map((p) => p.sequence).sort();
      expect(sequences).toEqual([1, 2, 3]);
    }
  });

  test("semua title tidak kosong", () => {
    for (const p of PANDUAN) {
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  test("tidak ada duplikat nilaiDasarId+sequence", () => {
    const keys = PANDUAN.map((p) => `${p.nilaiDasarId}:${p.sequence}`);
    expect(new Set(keys).size).toBe(21);
  });
});

describe("ANCHORS", () => {
  test("punya semua kode nilai dasar", () => {
    for (const code of NILAI_CODES) {
      expect(ANCHORS[code]).toBeDefined();
    }
  });

  test("setiap kode punya tepat 5 deskripsi", () => {
    for (const code of NILAI_CODES) {
      expect(ANCHORS[code].length).toBe(5);
    }
  });

  test("semua deskripsi tidak kosong", () => {
    for (const code of NILAI_CODES) {
      for (const text of ANCHORS[code]) {
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("FEEDBACKS", () => {
  test("punya semua kode nilai dasar", () => {
    for (const code of NILAI_CODES) {
      expect(FEEDBACKS[code]).toBeDefined();
    }
  });

  test("setiap kode punya tepat 5 template", () => {
    for (const code of NILAI_CODES) {
      expect(FEEDBACKS[code].length).toBe(5);
    }
  });

  test("template boleh kosong (level tertentu)", () => {
    // Beberapa feedback mungkin kosong untuk level tertentu
    // Yang penting array-nya ada dan length=5
    for (const code of NILAI_CODES) {
      expect(Array.isArray(FEEDBACKS[code])).toBe(true);
      expect(FEEDBACKS[code].length).toBe(5);
    }
  });
});

describe("Konsistensi PANDUAN ↔ NILAI_DASAR", () => {
  test("setiap nilaiDasarId di PANDUAN valid", () => {
    const validIds = new Set(NILAI_IDS);
    for (const p of PANDUAN) {
      expect(validIds.has(p.nilaiDasarId)).toBe(true);
    }
  });
});

describe("Konsistensi ANCHORS ↔ FEEDBACKS", () => {
  test("ANCHORS dan FEEDBACKS punya kode yang sama", () => {
    const anchorKeys = Object.keys(ANCHORS).sort();
    const feedbackKeys = Object.keys(FEEDBACKS).sort();
    expect(anchorKeys).toEqual(feedbackKeys);
  });
});
