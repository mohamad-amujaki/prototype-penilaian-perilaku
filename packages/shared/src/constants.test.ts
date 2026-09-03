/**
 * constants.test.ts — Unit test untuk konstanta inti aplikasi
 *
 * Memvalidasi:
 * - NILAI_DASAR: 7 item, length & sorting
 * - BARS_LEVELS: 5 level, level 1-5
 * - BUDAYA_KERJA: 3 dimensi
 * - CODE_TO_ID / ID_TO_CODE: konsisten bolak-balik (roundtrip)
 */

import { describe, expect, test } from "bun:test";
import {
  BARS_LEVELS,
  BUDAYA_KERJA,
  CODE_TO_ID,
  ID_TO_CODE,
  NILAI_DASAR,
} from "./constants";
import { NILAI_CODES } from "./scoring";

describe("NILAI_DASAR", () => {
  test("jumlah tepat 7", () => {
    expect(NILAI_DASAR.length).toBe(7);
  });

  test("sortOrder 1-7 tanpa duplikat", () => {
    const orders = NILAI_DASAR.map((n) => n.sortOrder).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("setiap item punya id, code, name, description", () => {
    for (const n of NILAI_DASAR) {
      expect(n.id.length).toBeGreaterThan(0);
      expect(n.code.length).toBeGreaterThan(0);
      expect(n.name.length).toBeGreaterThan(0);
      expect(n.description.length).toBeGreaterThan(0);
    }
  });

  test("code format ND-xx-XX", () => {
    for (const n of NILAI_DASAR) {
      expect(n.code).toMatch(/^ND-\d{2}-[A-Z]{2}$/);
    }
  });

  test("semua NILAI_CODES ada di NILAI_DASAR", () => {
    const codes = NILAI_DASAR.map((n) => n.code);
    for (const code of NILAI_CODES) {
      expect(codes).toContain(code);
    }
  });
});

describe("BARS_LEVELS", () => {
  test("jumlah tepat 5", () => {
    expect(BARS_LEVELS.length).toBe(5);
  });

  test("level 1-5", () => {
    const levels = BARS_LEVELS.map((b) => b.level);
    expect(levels).toEqual([1, 2, 3, 4, 5]);
  });

  test("setiap level punya name dan description", () => {
    for (const b of BARS_LEVELS) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
    }
  });
});

describe("BUDAYA_KERJA", () => {
  test("jumlah tepat 3", () => {
    expect(BUDAYA_KERJA.length).toBe(3);
  });

  test("code format BK-xx-XX", () => {
    for (const b of BUDAYA_KERJA) {
      expect(b.code).toMatch(/^BK-\d{2}-[A-Z]{2}$/);
    }
  });

  test("id unik", () => {
    const ids = BUDAYA_KERJA.map((b) => b.id);
    expect(new Set(ids).size).toBe(3);
  });

  test("setiap item punya name", () => {
    for (const b of BUDAYA_KERJA) {
      expect(b.name.length).toBeGreaterThan(0);
    }
  });
});

describe("CODE_TO_ID ↔ ID_TO_CODE roundtrip", () => {
  test("CODE_TO_ID punya 7 entry", () => {
    expect(Object.keys(CODE_TO_ID).length).toBe(7);
  });

  test("ID_TO_CODE punya 7 entry", () => {
    expect(Object.keys(ID_TO_CODE).length).toBe(7);
  });

  test("roundtrip: CODE_TO_ID lalu ID_TO_CODE kembali ke kode asal", () => {
    for (const [code, id] of Object.entries(CODE_TO_ID)) {
      expect(ID_TO_CODE[id]).toBe(code);
    }
  });

  test("roundtrip: ID_TO_CODE lalu CODE_TO_ID kembali ke id asal", () => {
    for (const [id, code] of Object.entries(ID_TO_CODE)) {
      expect(CODE_TO_ID[code as keyof typeof CODE_TO_ID]).toBe(id);
    }
  });

  test("semua kode di CODE_TO_ID ada di NILAI_CODES", () => {
    for (const code of Object.keys(CODE_TO_ID)) {
      expect(NILAI_CODES).toContain(code);
    }
  });
});
