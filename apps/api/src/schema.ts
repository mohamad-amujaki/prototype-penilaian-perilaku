import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const epoch = () => integer("created_at").notNull();

export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  level: text("level").notNull().default("lainnya"),
  parentUnitId: text("parent_unit_id"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  nip: text("nip").unique(),
  pangkatGolongan: text("pangkat_golongan"),
  jabatan: text("jabatan"),
  unitId: text("unit_id"),
  isActive: integer("is_active").notNull().default(1),
  mustChangePassword: integer("must_change_password").notNull().default(0),
  lastLogin: integer("last_login"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
  },
  (t) => ({ pk: uniqueIndex("user_roles_pk").on(t.userId, t.role) }),
);

export const nilaiDasar = sqliteTable("nilai_dasar", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

export const panduanPerilaku = sqliteTable(
  "panduan_perilaku",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(),
    sequence: integer("sequence").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
  },
  (t) => ({ uq: uniqueIndex("panduan_uq").on(t.nilaiDasarId, t.sequence) }),
);

export const barsLevels = sqliteTable("bars_levels", {
  level: integer("level").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const barsAnchors = sqliteTable(
  "bars_anchors",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(),
    level: integer("level").notNull(),
    anchorText: text("anchor_text").notNull(),
  },
  (t) => ({ uq: uniqueIndex("anchor_uq").on(t.nilaiDasarId, t.level) }),
);

export const feedbackTemplates = sqliteTable(
  "feedback_templates",
  {
    id: text("id").primaryKey(),
    nilaiDasarId: text("nilai_dasar_id").notNull(),
    level: integer("level").notNull(),
    templateText: text("template_text").notNull().default(""),
  },
  (t) => ({ uq: uniqueIndex("feedback_tpl_uq").on(t.nilaiDasarId, t.level) }),
);

export const budayaKerja = sqliteTable("budaya_kerja", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const assessmentPeriods = sqliteTable(
  "assessment_periods",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    quarter: text("quarter").notNull(),
    year: integer("year").notNull(),
    startDate: integer("start_date").notNull(),
    endDate: integer("end_date").notNull(),
    deadlineDate: integer("deadline_date").notNull(),
    status: text("status").notNull().default("draft"),
    description: text("description"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({ uq: uniqueIndex("period_year_quarter").on(t.year, t.quarter) }),
);

export const assessmentAssignments = sqliteTable(
  "assessment_assignments",
  {
    id: text("id").primaryKey(),
    periodId: text("period_id").notNull(),
    employeeId: text("employee_id").notNull(),
    assessorId: text("assessor_id"),
    unitId: text("unit_id").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({ uq: uniqueIndex("assign_period_emp").on(t.periodId, t.employeeId) }),
);

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().unique(),
  periodId: text("period_id").notNull(),
  employeeId: text("employee_id").notNull(),
  assessorId: text("assessor_id").notNull(),
  nilaiBp: integer("nilai_bp").notNull(),
  nilaiAk: integer("nilai_ak").notNull(),
  nilaiKp: integer("nilai_kp").notNull(),
  nilaiHm: integer("nilai_hm").notNull(),
  nilaiLy: integer("nilai_ly").notNull(),
  nilaiAd: integer("nilai_ad").notNull(),
  nilaiKb: integer("nilai_kb").notNull(),
  totalScore: integer("total_score").notNull(),
  scoreScale120: real("score_scale_120").notNull(),
  budayaEksekusiEfektif: real("budaya_ee").notNull(),
  budayaCaraKerjaBaru: real("budaya_ck").notNull(),
  budayaPelayananUnggul: real("budaya_pu").notNull(),
  additionalFeedback: text("additional_feedback"),
  status: text("status").notNull(),
  submittedAt: integer("submitted_at"),
  revisedAt: integer("revised_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const assessmentFeedbacks = sqliteTable(
  "assessment_feedbacks",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull(),
    nilaiDasarId: text("nilai_dasar_id").notNull(),
    level: integer("level").notNull(),
    templateText: text("template_text").notNull().default(""),
    finalText: text("final_text").notNull().default(""),
    isEdited: integer("is_edited").notNull().default(0),
    includeForEmployee: integer("include_for_employee").notNull().default(1),
  },
  (t) => ({ uq: uniqueIndex("af_uq").on(t.assessmentId, t.nilaiDasarId) }),
);

export const assessmentHistory = sqliteTable("assessment_history", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull(),
  action: text("action").notNull(),
  changedBy: text("changed_by").notNull(),
  changeDetails: text("change_details"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  periodId: text("period_id"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: integer("is_read").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const masterDataAudit = sqliteTable("master_data_audit", {
  id: text("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(),
  changedFields: text("changed_fields"),
  changedBy: text("changed_by").notNull(),
  changedAt: integer("changed_at").notNull(),
});

export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  organizationName: text("organization_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#185FA5"),
});

export { epoch };
