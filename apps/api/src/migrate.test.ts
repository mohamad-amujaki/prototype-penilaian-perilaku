/**
 * migrate.test.ts — Integration test untuk database migration
 *
 * Memvalidasi:
 * - migrate() bisa dijalankan tanpa error
 * - Semua 14 tabel terbuat
 * - Semua 12 index terbuat
 * - migrate() idempotent (bisa dijalankan berulang kali)
 */

import { describe, expect, test } from "bun:test";
import { sqlite } from "./db";
import { migrate } from "./migrate";

/** Daftar 14 tabel yang harus ada */
const EXPECTED_TABLES = [
  "units",
  "users",
  "user_roles",
  "nilai_dasar",
  "panduan_perilaku",
  "bars_levels",
  "bars_anchors",
  "feedback_templates",
  "budaya_kerja",
  "assessment_periods",
  "assessment_assignments",
  "assessments",
  "assessment_feedbacks",
  "assessment_history",
  "notifications",
  "master_data_audit",
  "system_settings",
];

/** Daftar index yang harus ada */
const EXPECTED_INDEXES = [
  "idx_assign_assessor",
  "idx_assign_period",
  "idx_assign_employee",
  "idx_assessments_period",
  "idx_assessments_employee",
  "idx_feedbacks_assessment",
  "idx_history_assessment",
  "idx_notif_user",
  "idx_users_nip",
  "idx_panduan_nilai",
  "idx_anchors_nilai",
  "idx_feedback_templates_nilai",
];

/** Ambil semua nama tabel dari SQLite */
function getTables(): string[] {
  const rows = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  return rows.map((r) => r.name).sort();
}

/** Ambil semua nama index dari SQLite */
function getIndexes(): string[] {
  const rows = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
    .all() as { name: string }[];
  return rows.map((r) => r.name).sort();
}

describe("migrate()", () => {
  test("tidak throw error", () => {
    expect(() => migrate()).not.toThrow();
  });

  test("idempotent — bisa dijalankan 2x tanpa error", () => {
    expect(() => {
      migrate();
      migrate();
    }).not.toThrow();
  });
});

describe("Tabel", () => {
  test("semua tabel ada setelah migrate", () => {
    migrate();
    const tables = getTables();
    for (const expected of EXPECTED_TABLES) {
      expect(tables).toContain(expected);
    }
  });
});

describe("Index", () => {
  test("semua index ada setelah migrate", () => {
    migrate();
    const indexes = getIndexes();
    for (const expected of EXPECTED_INDEXES) {
      expect(indexes).toContain(expected);
    }
  });
});

describe("Schema columns", () => {
  test("tabel users punya kolom token_version", () => {
    migrate();
    const cols = sqlite.query("PRAGMA table_info(users)").all() as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain("token_version");
  });

  test("tabel assessments punya kolom budaya_ee, budaya_ck, budaya_pu", () => {
    migrate();
    const cols = sqlite.query("PRAGMA table_info(assessments)").all() as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain("budaya_ee");
    expect(colNames).toContain("budaya_ck");
    expect(colNames).toContain("budaya_pu");
  });
});
