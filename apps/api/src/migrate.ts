/**
 * migrate.ts — Inisialisasi Skema Database
 *
 * Menjalankan perintah SQL CREATE TABLE IF NOT EXISTS untuk semua tabel.
 * Berjalan otomatis saat server dimulai (dipanggil di index.ts).
 *
 * CATATAN: Ini adalah pendekatan sederhana untuk prototype.
 * Di production, gunakan Drizzle Kit migration atau sistem migrasi terstruktur.
 *
 * Struktur tabel sudah dijelaskan di schema.ts menggunakan Drizzle ORM.
 * File ini hanya memastikan tabel tersedia di SQLite.
 */

import { sqlite } from "./db";

export function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'lainnya',
      parent_unit_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      nip TEXT UNIQUE,
      pangkat_golongan TEXT,
      jabatan TEXT,
      unit_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      token_version INTEGER NOT NULL DEFAULT 0,
      last_login INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      UNIQUE(user_id, role)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS nilai_dasar (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS panduan_perilaku (
      id TEXT PRIMARY KEY,
      nilai_dasar_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      UNIQUE(nilai_dasar_id, sequence)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bars_levels (
      level INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bars_anchors (
      id TEXT PRIMARY KEY,
      nilai_dasar_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      anchor_text TEXT NOT NULL,
      UNIQUE(nilai_dasar_id, level)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS feedback_templates (
      id TEXT PRIMARY KEY,
      nilai_dasar_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      template_text TEXT NOT NULL DEFAULT '',
      UNIQUE(nilai_dasar_id, level)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS budaya_kerja (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assessment_periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quarter TEXT NOT NULL,
      year INTEGER NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      deadline_date INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(year, quarter)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assessment_assignments (
      id TEXT PRIMARY KEY,
      period_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      assessor_id TEXT,
      unit_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(period_id, employee_id)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL UNIQUE,
      period_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      assessor_id TEXT NOT NULL,
      nilai_bp INTEGER NOT NULL,
      nilai_ak INTEGER NOT NULL,
      nilai_kp INTEGER NOT NULL,
      nilai_hm INTEGER NOT NULL,
      nilai_ly INTEGER NOT NULL,
      nilai_ad INTEGER NOT NULL,
      nilai_kb INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      score_scale_120 REAL NOT NULL,
      budaya_ee REAL NOT NULL,
      budaya_ck REAL NOT NULL,
      budaya_pu REAL NOT NULL,
      additional_feedback TEXT,
      status TEXT NOT NULL,
      submitted_at INTEGER,
      revised_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assessment_feedbacks (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      nilai_dasar_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      template_text TEXT NOT NULL DEFAULT '',
      final_text TEXT NOT NULL DEFAULT '',
      is_edited INTEGER NOT NULL DEFAULT 0,
      include_for_employee INTEGER NOT NULL DEFAULT 1,
      UNIQUE(assessment_id, nilai_dasar_id)
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assessment_history (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      change_details TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      period_id TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS master_data_audit (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_fields TEXT,
      changed_by TEXT NOT NULL,
      changed_at INTEGER NOT NULL
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      organization_name TEXT NOT NULL,
      logo_url TEXT,
      primary_color TEXT NOT NULL DEFAULT '#185FA5'
    );`);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS unit_leaders (
      unit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      leader_role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (unit_id, user_id)
    );`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_assign_assessor ON assessment_assignments(assessor_id, status);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_assign_period ON assessment_assignments(period_id, status);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_assign_employee ON assessment_assignments(employee_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_assessments_period ON assessments(period_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_assessments_employee ON assessments(employee_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_feedbacks_assessment ON assessment_feedbacks(assessment_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_assessment ON assessment_history(assessment_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_panduan_nilai ON panduan_perilaku(nilai_dasar_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_anchors_nilai ON bars_anchors(nilai_dasar_id);`);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_feedback_templates_nilai ON feedback_templates(nilai_dasar_id);
  `);
  // Tambah kolom token_version jika belum ada (untuk database lama)
  const cols = sqlite.query("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "token_version")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0");
  }
}
