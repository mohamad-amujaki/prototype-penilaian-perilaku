/**
 * util.test.ts — Unit test untuk utilitas API
 *
 * Memvalidasi fungsi-fungsi pendukung:
 * - uid(): generator ID unik dengan prefix
 * - now(): timestamp Unix epoch
 * - parseCsv(): parser CSV sederhana
 * - hashPassword() / Bun.password.verify(): hashing password
 * - requireRole(): otorisasi berbasis peran
 */

import { describe, expect, test } from "bun:test";
import {
  clearLoginAttempts,
  DEFAULT_PASSWORD,
  hashPassword,
  parseCsv,
  recordFailedLogin,
  assertLoginAllowed,
  loginAttemptKey,
  now,
  requireRole,
  uid,
} from "./util";

// ==================== uid() ====================

describe("uid()", () => {
  test("format prefix_12chars", () => {
    const id = uid("usr");
    expect(id).toMatch(/^usr_[a-f0-9]{12}$/);
  });

  test("default prefix 'id'", () => {
    const id = uid();
    expect(id).toMatch(/^id_[a-f0-9]{12}$/);
  });

  test("unik setiap panggilan", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

// ==================== now() ====================

describe("now()", () => {
  test("mengembalikan integer Unix epoch (detik)", () => {
    const t = now();
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBeGreaterThan(1_700_000_000); // setelah 2023
  });

  test("mendekati waktu sekarang", () => {
    const before = Math.floor(Date.now() / 1000);
    const t = now();
    const after = Math.floor(Date.now() / 1000);
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
});

// ==================== parseCsv() ====================

describe("parseCsv()", () => {
  test("parse CSV sederhana", () => {
    const csv = "NIP,Nama\n123,Budi\n456,Siti";
    const rows = parseCsv(csv);
    expect(rows).toEqual([
      ["NIP", "Nama"],
      ["123", "Budi"],
      ["456", "Siti"],
    ]);
  });

  test("handle quoted fields", () => {
    const csv = '"NIP","Nama"\n"123","Budi Pratama"';
    const rows = parseCsv(csv);
    expect(rows[1]).toEqual(["123", "Budi Pratama"]);
  });

  test("handle escaped quotes", () => {
    const csv = 'Name,Addr\n"John","Jl. ""No. 1"" City"';
    const rows = parseCsv(csv);
    expect(rows[1][1]).toBe('Jl. "No. 1" City');
  });

  test("skip baris kosong", () => {
    const csv = "A,B\n\nC,D\n\n";
    const rows = parseCsv(csv);
    expect(rows.length).toBe(2);
  });

  test("handle Windows line endings", () => {
    const csv = "A,B\r\nC,D\r\n";
    const rows = parseCsv(csv);
    expect(rows.length).toBe(2);
  });

  test("handle tanpa newline di akhir", () => {
    const csv = "A,B\nC,D";
    const rows = parseCsv(csv);
    expect(rows.length).toBe(2);
  });

  test("handle string kosong", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

// ==================== hashPassword() ====================

describe("hashPassword()", () => {
  test("menghasilkan hash bcrypt", async () => {
    const hash = await hashPassword("test123");
    expect(hash).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix
  });

  test("hash berbeda untuk input sama (salt acak)", async () => {
    const h1 = await hashPassword("test123");
    const h2 = await hashPassword("test123");
    expect(h1).not.toBe(h2);
  });

  test("bisa diverifikasi", async () => {
    const hash = await hashPassword("password123");
    const ok = await Bun.password.verify("password123", hash);
    expect(ok).toBe(true);
  });

  test("verifikasi gagal untuk password salah", async () => {
    const hash = await hashPassword("password123");
    const ok = await Bun.password.verify("wrongpassword", hash);
    expect(ok).toBe(false);
  });
});

// ==================== DEFAULT_PASSWORD ====================

describe("DEFAULT_PASSWORD", () => {
  test("memenuhi syarat minimum", () => {
    expect(DEFAULT_PASSWORD.length).toBeGreaterThanOrEqual(8);
    expect(DEFAULT_PASSWORD).toMatch(/[a-zA-Z]/); // ada huruf
    expect(DEFAULT_PASSWORD).toMatch(/[0-9]/);     // ada angka
  });
});

// ==================== requireRole() ====================

describe("requireRole()", () => {
  const user = { id: "1", roles: ["admin", "assessor"] as const };

  test("throw 401 jika user null", () => {
    try {
      requireRole(null, ["admin"]);
      expect(true).toBe(false); // tidak boleh sampai sini
    } catch (e) {
      expect((e as Error & { status: number }).status).toBe(401);
    }
  });

  test("return user jika punya role yang diminta", () => {
    const result = requireRole(user as any, ["admin"]);
    expect(result).toBe(user);
  });

  test("throw 403 jika tidak punya role", () => {
    try {
      requireRole(user as any, ["leadership"]);
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error & { status: number }).status).toBe(403);
    }
  });

  test("return user jika punya salah satu dari beberapa role", () => {
    const result = requireRole(user as any, ["admin", "leadership"]);
    expect(result).toBe(user);
  });
});

// ==================== Rate Limiting ====================

describe("Rate Limiting", () => {
  test("loginAttemptKey format email|ip", () => {
    const key = loginAttemptKey("User@Email.com", "192.168.1.1");
    expect(key).toBe("user@email.com|192.168.1.1");
  });

  test("assertLoginAllowed tidak throw untuk key baru", () => {
    const key = `test_${Date.now()}@email.com|127.0.0.1`;
    assertLoginAllowed(key); // tidak boleh throw
    clearLoginAttempts(key);
  });

  test("recordFailedLogin + assertLoginAllowed throw setelah 5 kali", () => {
    const key = `ratelimittest_${Date.now()}@email.com|127.0.0.1`;
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(key);
    }
    try {
      assertLoginAllowed(key);
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error & { status: number }).status).toBe(429);
    }
    clearLoginAttempts(key);
  });
});
