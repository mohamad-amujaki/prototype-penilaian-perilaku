/**
 * schema.ts — Definisi skema database menggunakan Drizzle ORM
 *
 * Berisi definisi 14 tabel database yang menjalankan seluruh sistem:
 *
 * TABEL MASTER:
 * - units: unit organisasi (hierarki dengan parent_unit_id)
 * - users: data pengguna (akun, NIP, jabatan)
 * - user_roles: peran pengguna (admin, assessor, employee, leadership)
 *
 * TABEL REFERENSI:
 * - nilai_dasar: 7 nilai dasar BerAKHLAK
 * - panduan_perilaku: 21 pedoman perilaku (3 per nilai)
 * - bars_levels: 5 level BARS (1-5)
 * - bars_anchors: 35 deskripsi jangkar (5 per nilai)
 * - feedback_templates: 35 template umpan balik (5 per nilai)
 * - budaya_kerja: 3 dimensi budaya kerja
 *
 * TABEL OPERASIONAL:
 * - assessment_periods: periode penilaian (Q1, Q2, dst.)
 * - assessment_assignments: penugasan penilai-pegawai per periode
 * - assessments: data penilaian (7 skor + hasil kalkulasi)
 * - assessment_feedbacks: umpan balik per nilai dasar
 * - assessment_history: riwayat tindakan penilaian
 * - notifications: notifikasi dalam aplikasi
 * - master_data_audit: audit trail perubahan master data
 * - system_settings: pengaturan sistem (nama organisasi, logo, warna)
 */

import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { UnitLevel } from "@app/shared";

/**
 * Helper untuk membuat kolom timestamp epoch (Unix timestamp dalam detik).
 * Mengembalikan integer() dengan nama kolom "created_at" atau "updated_at".
 */
const epoch = () => integer("created_at").notNull();

// ==================== TABEL MASTER ====================

/**
 * Tabel Unit Organisasi.
 * Mendukung hierarki: setiap unit bisa memiliki parent_unit_id (unit induk).
 * Contoh: "Seksi Kinerja" (level: seksi) → induk: "Bagian SDM" (level: bagian)
 */
export const units = sqliteTable("units", {
  id: text("id").primaryKey(),                    // ID unik (unit_kinerja, unit_sdm, dll.)
  code: text("code").notNull().unique(),          // Kode unit (SK-KIN, BAG-SDM, dst.)
  name: text("name").notNull(),                   // Nama unit
  level: text("level", { enum: [UnitLevel.ESELON_1, UnitLevel.UNIT_KERJA, UnitLevel.TIM_KERJA, UnitLevel.SEKSI, UnitLevel.LAINNYA] }).notNull().default(UnitLevel.LAINNYA), // Level hierarki (enum UnitLevel)
  parentUnitId: text("parent_unit_id"),           // ID unit induk (null jika unit teratas)
  isActive: integer("is_active").notNull().default(1), // Status aktif (1=aktif, 0=nonaktif)
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Tabel Unit Leaders.
 * Menghubungkan unit dengan pengguna yang menjadi pimpinan unit tersebut.
 */
export const unitLeaders = sqliteTable(
  "unit_leaders",
  {
    unitId: text("unit_id").notNull(),
    userId: text("user_id").notNull(),
    leaderRole: text("leader_role").notNull(), // e.g., "eselon_1_leader", "unit_kerja_leader", "tim_kerja_leader"
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({ pk: uniqueIndex("unit_leaders_pk").on(t.unitId, t.userId) }),
);

/**
 * Tabel Pengguna (Users).
 * Menyimpan data akun dan profil pegawai.
 * Satu pengguna bisa memiliki banyak peran (user_roles).
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),                    // ID unik pengguna
  email: text("email").notNull().unique(),        // Email login (unik)
  username: text("username"),                     // Username (opsional, default = email)
  passwordHash: text("password_hash").notNull(),  // Hash password bcrypt
  fullName: text("full_name").notNull(),          // Nama lengkap
  nip: text("nip").unique(),                      // Nomor Induk Pegawai (17-18 digit)
  pangkatGolongan: text("pangkat_golongan"),      // Pangkat/golongan (contoh: Penata / III.c)
  jabatan: text("jabatan"),                       // Jabatan (contoh: Analis Kinerja)
  unitId: text("unit_id"),                        // ID unit tempat bertugas
  isActive: integer("is_active").notNull().default(1), // Status aktif
  mustChangePassword: integer("must_change_password").notNull().default(0), // Wajib ganti password (1=setelah admin reset)
  tokenVersion: integer("token_version").notNull().default(0), // Versi token, di-increment saat password berubah untuk invalidate session lama
  lastLogin: integer("last_login"),               // Timestamp login terakhir
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Tabel Peran Pengguna (User Roles).
 * Relasi many-to-many: satu pengguna bisa memiliki beberapa peran.
 * Unique constraint: kombinasi user_id + role harus unik.
 */
export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id").notNull(),            // ID pengguna
    role: text("role").notNull(),                 // Peran (admin, assessor, employee, leadership)
  },
  (t) => ({ pk: uniqueIndex("user_roles_pk").on(t.userId, t.role) }),
);

// ==================== TABEL REFERENSI ====================

/** Tabel Nilai Dasar BerAKHLAK (7 baris: BP, AK, KP, HM, LY, AD, KB) */
export const nilaiDasar = sqliteTable("nilai_dasar", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),          // Kode pendek (BP, AK, dst.)
  name: text("name").notNull(),                   // Nama lengkap
  description: text("description").notNull(),     // Deskripsi makna
  sortOrder: integer("sort_order").notNull(),     // Urutan tampilan
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by"),                  // ID pengguna yang terakhir mengubah
});

/**
 * Tabel Panduan Perilaku (21 baris: 3 per nilai dasar).
 * Setiap panduan adalah indikator perilaku yang bisa diamati.
 */
export const panduanPerilaku = sqliteTable(
  "panduan_perilaku",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(), // FK ke nilai_dasar
    sequence: integer("sequence").notNull(),         // Urutan (1, 2, atau 3)
    title: text("title").notNull(),                  // Teks panduan
    description: text("description").notNull(),      // Deskripsi (sama dengan title untuk seed)
  },
  (t) => ({ uq: uniqueIndex("panduan_uq").on(t.nilaiDasarId, t.sequence) }),
);

/** Tabel Level BARS (5 baris: level 1-5) */
export const barsLevels = sqliteTable("bars_levels", {
  level: integer("level").primaryKey(),          // Level BARS (1-5)
  name: text("name").notNull(),                  // Nama level (Kontraproduktif s/d Role Model)
  description: text("description").notNull(),    // Deskripsi level
});

/**
 * Tabel Jangkar BARS (35 baris: 5 per nilai dasar).
 * Deskripsi perilaku konkret untuk setiap kombinasi nilai + level.
 */
export const barsAnchors = sqliteTable(
  "bars_anchors",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(), // FK ke nilai_dasar
    level: integer("level").notNull(),              // Level BARS (1-5)
    anchorText: text("anchor_text").notNull(),      // Teks deskripsi jangkar
  },
  (t) => ({ uq: uniqueIndex("anchor_uq").on(t.nilaiDasarId, t.level) }),
);

/**
 * Tabel Template Umpan Balik (35 baris: 5 per nilai dasar).
 * Template default yang otomatis terisi saat penilai memilih level.
 * Penilai bisa mengedit teks umpan balik sebelum disubmit.
 */
export const feedbackTemplates = sqliteTable(
  "feedback_templates",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(), // FK ke nilai_dasar
    level: integer("level").notNull(),              // Level BARS (1-5)
    templateText: text("template_text").notNull().default(""), // Teks template
  },
  (t) => ({ uq: uniqueIndex("feedback_tpl_uq").on(t.nilaiDasarId, t.level) }),
);

/** Tabel Budaya Kerja (3 baris: EE, CK, PU) */
export const budayaKerja = sqliteTable("budaya_kerja", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),         // Kode (EE, CK, PU)
  name: text("name").notNull(),                  // Nama (Eksekusi Efektif, dll.)
});

// ==================== TABEL OPERASIONAL ====================

/**
 * Tabel Periode Penilaian.
 * Menentukan kapan penilaian aktif dan kapan deadline.
 * Status: draft → active → closed
 */
export const assessmentPeriods = sqliteTable(
  "assessment_periods",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),                 // Nama periode (contoh: "Q1 2026")
    quarter: text("quarter").notNull(),           // Kuartal (Q1, Q2, Q3, Q4)
    year: integer("year").notNull(),              // Tahun
    startDate: integer("start_date").notNull(),   // Tanggal mulai (epoch)
    endDate: integer("end_date").notNull(),       // Tanggal akhir (epoch)
    deadlineDate: integer("deadline_date").notNull(), // Batas waktu pengisian (epoch)
    status: text("status").notNull().default("draft"), // Status: draft/active/closed
    description: text("description"),             // Deskripsi (opsional)
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({ uq: uniqueIndex("period_year_quarter").on(t.year, t.quarter) }),
);

/**
 * Tabel Penugasan Penilaian.
 * Menghubungkan pegawai dengan penilai untuk periode tertentu.
 * Satu pegawai hanya boleh dinilai sekali per periode (unique constraint).
 */
export const assessmentAssignments = sqliteTable(
  "assessment_assignments",
  {
    id: text("id").primaryKey(),
    periodId: text("period_id").notNull(),        // FK ke assessment_periods
    employeeId: text("employee_id").notNull(),    // FK ke users (pegawai yang dinilai)
    assessorId: text("assessor_id"),              // FK ke users (penilai/atasan, bisa null jika unassigned)
    unitId: text("unit_id").notNull(),            // FK ke units
    status: text("status").notNull().default("pending"), // Status: pending/submitted/revised/draft/unassigned
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({ uq: uniqueIndex("assign_period_emp").on(t.periodId, t.employeeId) }),
);

/**
 * Tabel Penilaian.
 * Menyimpan hasil penilaian lengkap: 7 skor mentah + semua hasil kalkulasi.
 * Satu assignment hanya boleh memiliki satu assessment (unique constraint).
 */
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().unique(), // FK ke assignments (1:1)
  periodId: text("period_id").notNull(),         // FK ke assessment_periods
  employeeId: text("employee_id").notNull(),     // FK ke users (pegawai)
  assessorId: text("assessor_id").notNull(),     // FK ke users (penilai)
  // 7 skor mentah (level BARS 1-5)
  nilaiBp: integer("nilai_bp").notNull(),
  nilaiAk: integer("nilai_ak").notNull(),
  nilaiKp: integer("nilai_kp").notNull(),
  nilaiHm: integer("nilai_hm").notNull(),
  nilaiLy: integer("nilai_ly").notNull(),
  nilaiAd: integer("nilai_ad").notNull(),
  nilaiKb: integer("nilai_kb").notNull(),
  // Hasil kalkulasi
  totalScore: integer("total_score").notNull(),           // Total skor mentah (0-35)
  scoreScale120: real("score_scale_120").notNull(),       // Skor skala 120
  budayaEksekusiEfektif: real("budaya_ee").notNull(),     // Dimensi EE
  budayaCaraKerjaBaru: real("budaya_ck").notNull(),       // Dimensi CK
  budayaPelayananUnggul: real("budaya_pu").notNull(),     // Dimensi PU
  additionalFeedback: text("additional_feedback"),         // Umpan balik tambahan (opsional)
  status: text("status").notNull(),                // Status: draft/submitted/revised
  submittedAt: integer("submitted_at"),             // Waktu submit pertama
  revisedAt: integer("revised_at"),                 // Waktu revisi terakhir
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Tabel Umpan Balik Penilaian.
 * Menyimpan teks umpan balik per nilai dasar untuk setiap assessment.
 * Terdiri dari template default + teks final yang bisa diedit penilai.
 */
export const assessmentFeedbacks = sqliteTable(
  "assessment_feedbacks",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull(),       // FK ke assessments
    nilaiDasarId: text("nilai_dasar_id").notNull(),      // FK ke nilai_dasar
    level: integer("level").notNull(),                   // Level yang dipilih (1-5)
    templateText: text("template_text").notNull().default(""), // Template default dari master data
    finalText: text("final_text").notNull().default(""),       // Teks final (bisa diedit penilai)
    isEdited: integer("is_edited").notNull().default(0),      // Apakah sudah diedit (1=ya)
    includeForEmployee: integer("include_for_employee").notNull().default(1), // Tampilkan ke pegawai (1=ya)
  },
  (t) => ({ uq: uniqueIndex("af_uq").on(t.assessmentId, t.nilaiDasarId) }),
);

/**
 * Tabel Riwayat Penilaian.
 * Audit trail untuk setiap tindakan: submit, revisi, dll.
 */
export const assessmentHistory = sqliteTable("assessment_history", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull(),   // FK ke assessments
  action: text("action").notNull(),                // Tindakan (submitted, revised, draft)
  changedBy: text("changed_by").notNull(),         // ID pengguna yang melakukan
  changeDetails: text("change_details"),           // Detail perubahan (JSON)
  ipAddress: text("ip_address"),                   // IP address pelaku
  createdAt: integer("created_at").notNull(),
});

/**
 * Tabel Notifikasi.
 * Pesan notifikasi dalam aplikasi (contoh: "Penilaian periode Q1 aktif").
 */
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),               // Penerima notifikasi
  type: text("type").notNull(),                   // Tipe (period_active, deadline_reminder, dll.)
  periodId: text("period_id"),                     // Terkait periode (opsional)
  subject: text("subject").notNull(),              // Subjek notifikasi
  body: text("body").notNull(),                    // Isi pesan
  isRead: integer("is_read").notNull().default(0), // Status baca (0=belum, 1=sudah)
  createdAt: integer("created_at").notNull(),
});

/**
 * Tabel Audit Master Data.
 * Mencatat setiap perubahan pada data master (nilai dasar, anchors, feedback, dll.)
 */
export const masterDataAudit = sqliteTable("master_data_audit", {
  id: text("id").primaryKey(),
  tableName: text("table_name").notNull(),         // Nama tabel yang diubah
  recordId: text("record_id").notNull(),           // ID record yang diubah
  action: text("action").notNull(),                // Tindakan (update, create, delete)
  changedFields: text("changed_fields"),           // Field yang berubah (JSON)
  changedBy: text("changed_by").notNull(),         // ID pengubah
  changedAt: integer("changed_at").notNull(),      // Waktu perubahan
});

/**
 * Tabel Pengaturan Sistem.
 * Menyimpan pengaturan global: nama organisasi, logo, warna tema.
 * Saat ini hanya ada satu baris (id="default").
 */
export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  organizationName: text("organization_name").notNull(), // Nama organisasi
  logoUrl: text("logo_url"),                             // URL logo (opsional)
  primaryColor: text("primary_color").notNull().default("#185FA5"), // Warna utama tema
});

export { epoch };
