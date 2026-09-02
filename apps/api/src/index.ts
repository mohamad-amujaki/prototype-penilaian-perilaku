import {
  CODE_TO_ID,
  ID_TO_CODE,
  NILAI_CODES,
  calculateScores,
  getCategory,
  type AssessmentScores,
  type NilaiCode,
  type Role,
} from "@app/shared";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "./db";
import { migrate } from "./migrate";
import * as sch from "./schema";
import { seed } from "./seed";
import { buildImportTemplate, headerMatches, nipsMatch, normalizeNip, parseImportFile } from "./import-workbook";
import {
  assertLoginAllowed,
  clearLoginAttempts,
  clearLoginAttemptsForEmail,
  DEFAULT_PASSWORD,
  descendantUnitIds,
  hasRole,
  hashPassword,
  loadUser,
  loginAttemptKey,
  notify,
  now,
  recordFailedLogin,
  requireRole,
  signToken,
  uid,
  verifyToken,
  type SessionUser,
} from "./util";

migrate();
await seed(false);

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const COOKIE = "pp_session";

function scoresFromRow(row: typeof sch.assessments.$inferSelect): AssessmentScores {
  return {
    BP: row.nilaiBp,
    AK: row.nilaiAk,
    KP: row.nilaiKp,
    HM: row.nilaiHm,
    LY: row.nilaiLy,
    AD: row.nilaiAd,
    KB: row.nilaiKb,
  };
}

function publicAssessment(row: typeof sch.assessments.$inferSelect, forEmployee: boolean) {
  const scores = scoresFromRow(row);
  const calc = calculateScores(scores);
  const fbs = db
    .select()
    .from(sch.assessmentFeedbacks)
    .where(eq(sch.assessmentFeedbacks.assessmentId, row.id))
    .all()
    .filter((f) => (forEmployee ? f.includeForEmployee === 1 : true))
    .map((f) => ({
      nilaiDasarId: f.nilaiDasarId,
      nilaiDasarCode: ID_TO_CODE[f.nilaiDasarId],
      level: f.level,
      feedbackText: f.finalText,
      wasCustomized: Boolean(f.isEdited),
      includeForEmployee: Boolean(f.includeForEmployee),
    }));
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    periodId: row.periodId,
    employeeId: row.employeeId,
    assessorId: row.assessorId,
    status: row.status,
    submittedAt: row.submittedAt,
    revisedAt: row.revisedAt,
    additionalFeedback: row.additionalFeedback,
    scores,
    calculations: calc,
    feedbacks: fbs,
  };
}

function cookieHeader(token: string, clear = false) {
  if (clear) {
    return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

function getCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  const parts = header.split(";").map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(`${name}=`));
  return hit?.slice(name.length + 1);
}

const app = new Elysia()
  .onRequest(({ request, set }) => {
    set.headers["Access-Control-Allow-Origin"] = WEB_ORIGIN;
    set.headers["Access-Control-Allow-Credentials"] = "true";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type";
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,PATCH,DELETE,OPTIONS";
    if (request.method === "OPTIONS") {
      set.status = 204;
    }
  })
  .options("/*", () => "")
  .derive(({ request }) => {
    const token = getCookie(request.headers.get("cookie") ?? undefined, COOKIE);
    const payload = verifyToken(token);
    const user = payload ? loadUser(payload.sub) : null;
    return { user, ip: request.headers.get("x-forwarded-for") ?? "local" };
  })
  .onError(({ error, set }) => {
    const status = (error as { status?: number }).status ?? 500;
    set.status = status;
    return { error: { code: status, message: error.message } };
  })
  .get("/api/health", () => ({ ok: true }))
  .post(
    "/api/auth/login",
    async ({ body, ip, set }) => {
      const key = loginAttemptKey(body.email, ip);
      assertLoginAllowed(key);
      const userRow = db
        .select()
        .from(sch.users)
        .where(eq(sch.users.email, body.email.toLowerCase()))
        .get();
      if (!userRow || !userRow.isActive) {
        recordFailedLogin(key);
        set.status = 401;
        return { error: { code: 401, message: "Email atau password salah" } };
      }
      const ok = await Bun.password.verify(body.password, userRow.passwordHash);
      if (!ok) {
        recordFailedLogin(key);
        set.status = 401;
        return { error: { code: 401, message: "Email atau password salah" } };
      }
      clearLoginAttempts(key);
      db.update(sch.users)
        .set({ lastLogin: now(), updatedAt: now() })
        .where(eq(sch.users.id, userRow.id))
        .run();
      const token = signToken({ sub: userRow.id });
      set.headers["Set-Cookie"] = cookieHeader(token);
      return { user: loadUser(userRow.id) };
    },
    { body: t.Object({ email: t.String(), password: t.String() }) },
  )
  .post("/api/auth/logout", ({ set }) => {
    set.headers["Set-Cookie"] = cookieHeader("", true);
    return { ok: true };
  })
  .get("/api/me", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: { code: 401, message: "Unauthorized" } };
    }
    return { user };
  })
  .patch(
    "/api/me/profile",
    ({ user, body, set }) => {
      requireRole(user, ["admin", "assessor", "employee", "leadership"]);
      const nip = normalizeNip(body.nip);
      const jabatan = body.jabatan.trim();
      if (nip && !/^\d{17,18}$/.test(nip)) {
        set.status = 400;
        return { error: { code: 400, message: "NIP harus 17 atau 18 digit angka" } };
      }
      if (jabatan.length > 120) {
        set.status = 400;
        return { error: { code: 400, message: "Jabatan maksimal 120 karakter" } };
      }
      if (nip) {
        const clash = db
          .select()
          .from(sch.users)
          .all()
          .find((row) => row.id !== user!.id && nipsMatch(row.nip, nip));
        if (clash) {
          set.status = 400;
          return { error: { code: 400, message: "NIP sudah dipakai akun lain" } };
        }
      }
      db.update(sch.users)
        .set({ nip: nip || null, jabatan: jabatan || null, updatedAt: now() })
        .where(eq(sch.users.id, user!.id))
        .run();
      return { user: loadUser(user!.id) };
    },
    { body: t.Object({ nip: t.String(), jabatan: t.String() }) },
  )
  .post(
    "/api/auth/change-password",
    async ({ user, body, set }) => {
      requireRole(user, ["admin", "assessor", "employee", "leadership"]);
      const row = db.select().from(sch.users).where(eq(sch.users.id, user!.id)).get();
      if (!row) {
        set.status = 401;
        return { error: { code: 401, message: "Unauthorized" } };
      }
      if (!row.mustChangePassword) {
        if (!body.currentPassword) {
          set.status = 400;
          return { error: { code: 400, message: "Password saat ini wajib diisi" } };
        }
        const ok = await Bun.password.verify(body.currentPassword, row.passwordHash);
        if (!ok) {
          set.status = 400;
          return { error: { code: 400, message: "Password saat ini salah" } };
        }
      }
      if (body.password.length < 8 || !/[A-Za-z]/.test(body.password) || !/[0-9]/.test(body.password)) {
        set.status = 400;
        return { error: { code: 400, message: "Password baru min 8 karakter, ada huruf dan angka" } };
      }
      const hash = await hashPassword(body.password);
      db.update(sch.users)
        .set({ passwordHash: hash, mustChangePassword: 0, updatedAt: now() })
        .where(eq(sch.users.id, user!.id))
        .run();
      return { ok: true };
    },
    { body: t.Object({ password: t.String(), currentPassword: t.Optional(t.String()) }) },
  )
  .get("/api/notifications", ({ user }) => {
    requireRole(user, ["admin", "assessor", "employee", "leadership"]);
    return {
      data: db
        .select()
        .from(sch.notifications)
        .where(eq(sch.notifications.userId, user!.id))
        .orderBy(desc(sch.notifications.createdAt))
        .all()
        .slice(0, 50),
    };
  })
  .post("/api/notifications/:id/read", ({ user, params }) => {
    requireRole(user, ["admin", "assessor", "employee", "leadership"]);
    db.update(sch.notifications)
      .set({ isRead: 1 })
      .where(and(eq(sch.notifications.id, params.id), eq(sch.notifications.userId, user!.id)))
      .run();
    return { ok: true };
  })
  .get("/api/admin/periods", ({ user }) => {
    requireRole(user, ["admin"]);
    return { data: db.select().from(sch.assessmentPeriods).orderBy(desc(sch.assessmentPeriods.year)).all() };
  })
  .post(
    "/api/admin/periods",
    ({ user, body, set }) => {
      requireRole(user, ["admin"]);
      if (body.startDate >= body.endDate) {
        set.status = 400;
        return { error: { code: 400, message: "Tanggal mulai harus sebelum selesai" } };
      }
      if (body.deadlineDate < body.endDate) {
        set.status = 400;
        return { error: { code: 400, message: "Deadline harus >= tanggal selesai" } };
      }
      const others = db.select().from(sch.assessmentPeriods).all();
      if (others.some((p) => p.year === body.year && p.quarter === body.quarter)) {
        set.status = 400;
        return { error: { code: 400, message: "Quarter sudah ada di tahun itu" } };
      }
      if (others.some((p) => !(body.endDate < p.startDate || body.startDate > p.endDate))) {
        set.status = 400;
        return { error: { code: 400, message: "Rentang periode overlap" } };
      }
      const row = {
        id: uid("prd"),
        name: body.name,
        quarter: body.quarter,
        year: body.year,
        startDate: body.startDate,
        endDate: body.endDate,
        deadlineDate: body.deadlineDate,
        status: "draft" as const,
        description: body.description ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.insert(sch.assessmentPeriods).values(row).run();
      return { data: row };
    },
    {
      body: t.Object({
        name: t.String(),
        quarter: t.Union([t.Literal("Q1"), t.Literal("Q2"), t.Literal("Q3"), t.Literal("Q4")]),
        year: t.Number(),
        startDate: t.Number(),
        endDate: t.Number(),
        deadlineDate: t.Number(),
        description: t.Optional(t.String()),
      }),
    },
  )
  .post("/api/admin/periods/:id/activate", ({ user, params, set }) => {
    requireRole(user, ["admin"]);
    const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, params.id)).get();
    if (!period) {
      set.status = 404;
      return { error: { code: 404, message: "Periode tidak ditemukan" } };
    }
    const active = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.status, "active")).get();
    if (active && active.id !== period.id) {
      set.status = 400;
      return { error: { code: 400, message: "Sudah ada periode aktif" } };
    }
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, period.id))
      .all();
    if (!assigns.length) {
      set.status = 400;
      return { error: { code: 400, message: "Belum ada assignment" } };
    }
    if (assigns.some((a) => !a.assessorId || a.status === "unassigned")) {
      set.status = 400;
      return { error: { code: 400, message: "Masih ada pegawai tanpa assessor" } };
    }
    db.update(sch.assessmentPeriods)
      .set({ status: "active", updatedAt: now() })
      .where(eq(sch.assessmentPeriods.id, period.id))
      .run();
    const assessorIds = [...new Set(assigns.map((a) => a.assessorId).filter(Boolean))] as string[];
    for (const aid of assessorIds) {
      notify({
        userId: aid,
        type: "period_active",
        periodId: period.id,
        subject: `Periode ${period.name} aktif`,
        body: `Anda ditugaskan menilai pegawai untuk ${period.name}.`,
      });
    }
    return { ok: true };
  })
  .post("/api/admin/periods/:id/close", ({ user, params }) => {
    requireRole(user, ["admin"]);
    db.update(sch.assessmentPeriods)
      .set({ status: "closed", updatedAt: now() })
      .where(eq(sch.assessmentPeriods.id, params.id))
      .run();
    const leaders = db.select().from(sch.userRoles).where(eq(sch.userRoles.role, "leadership")).all();
    const admins = db.select().from(sch.userRoles).where(eq(sch.userRoles.role, "admin")).all();
    for (const r of [...leaders, ...admins]) {
      notify({
        userId: r.userId,
        type: "period_closed",
        periodId: params.id,
        subject: "Periode ditutup",
        body: "Penilaian dikunci. Laporan siap ditinjau.",
      });
    }
    return { ok: true };
  })
  .post("/api/admin/periods/:id/reopen", ({ user, params, set }) => {
    requireRole(user, ["admin"]);
    const active = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.status, "active")).get();
    if (active) {
      set.status = 400;
      return { error: { code: 400, message: "Tutup periode aktif dulu" } };
    }
    db.update(sch.assessmentPeriods)
      .set({ status: "active", updatedAt: now() })
      .where(eq(sch.assessmentPeriods.id, params.id))
      .run();
    return { ok: true };
  })
  .delete("/api/admin/periods/:id", ({ user, params, set }) => {
    requireRole(user, ["admin"]);
    const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, params.id)).get();
    if (!period || period.status !== "draft") {
      set.status = 400;
      return { error: { code: 400, message: "Hanya draft yang bisa dihapus" } };
    }
    db.delete(sch.assessmentAssignments).where(eq(sch.assessmentAssignments.periodId, period.id)).run();
    db.delete(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, period.id)).run();
    return { ok: true };
  })
  .get("/api/admin/periods/:id/progress", ({ user, params }) => {
    requireRole(user, ["admin"]);
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, params.id))
      .all();
    const done = assigns.filter((a) => a.status === "submitted" || a.status === "revised").length;
    return {
      total: assigns.length,
      done,
      pending: assigns.length - done,
      percent: assigns.length ? Math.round((done / assigns.length) * 100) : 0,
      assignments: assigns,
    };
  })
  .get("/api/admin/users", ({ user }) => {
    requireRole(user, ["admin"]);
    const users = db.select().from(sch.users).all();
    const roles = db.select().from(sch.userRoles).all();
    const units = db.select().from(sch.units).all();
    return {
      data: users.map((u) => ({
        ...u,
        passwordHash: undefined,
        roles: roles.filter((r) => r.userId === u.id).map((r) => r.role),
        unitName: units.find((x) => x.id === u.unitId)?.name ?? null,
      })),
    };
  })
  .post(
    "/api/admin/users",
    async ({ user, body }) => {
      requireRole(user, ["admin"]);
      const password = body.password?.trim() || DEFAULT_PASSWORD;
      const row = {
        id: uid("usr"),
        email: body.email.toLowerCase(),
        username: body.email.toLowerCase(),
        passwordHash: await hashPassword(password),
        fullName: body.fullName,
        nip: body.nip,
        jabatan: body.jabatan ?? null,
        pangkatGolongan: body.pangkatGolongan ?? null,
        unitId: body.unitId ?? null,
        isActive: 1,
        mustChangePassword: 1,
        createdAt: now(),
        updatedAt: now(),
      };
      db.insert(sch.users).values(row).run();
      const roles: Role[] = body.roles?.length ? body.roles : ["employee"];
      if (!roles.includes("employee")) roles.push("employee");
      for (const role of roles) {
        db.insert(sch.userRoles).values({ userId: row.id, role }).run();
      }
      return { data: { id: row.id, defaultPassword: DEFAULT_PASSWORD } };
    },
    {
      body: t.Object({
        email: t.String(),
        fullName: t.String(),
        nip: t.String(),
        jabatan: t.Optional(t.String()),
        pangkatGolongan: t.Optional(t.String()),
        unitId: t.Optional(t.String()),
        password: t.Optional(t.String()),
        roles: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .patch(
    "/api/admin/users/:id",
    ({ user, params, body }) => {
      requireRole(user, ["admin"]);
      db.update(sch.users)
        .set({
          fullName: body.fullName,
          jabatan: body.jabatan ?? null,
          unitId: body.unitId ?? null,
          isActive: body.isActive ?? 1,
          updatedAt: now(),
        })
        .where(eq(sch.users.id, params.id))
        .run();
      if (body.roles) {
        db.delete(sch.userRoles).where(eq(sch.userRoles.userId, params.id)).run();
        const roles = body.roles.includes("employee") ? body.roles : [...body.roles, "employee"];
        for (const role of roles) {
          db.insert(sch.userRoles).values({ userId: params.id, role }).run();
        }
      }
      return { ok: true };
    },
    {
      body: t.Object({
        fullName: t.String(),
        jabatan: t.Optional(t.String()),
        unitId: t.Optional(t.String()),
        isActive: t.Optional(t.Number()),
        roles: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .patch(
    "/api/admin/users/:id/roles",
    ({ user, params, body, set }) => {
      requireRole(user, ["admin"]);
      const allowed: Role[] = ["admin", "assessor", "employee", "leadership"];
      const incoming = [...new Set(body.roles.filter((r): r is Role => allowed.includes(r as Role)))];
      if (!incoming.includes("employee")) incoming.push("employee");
      const currentRoles = db
        .select()
        .from(sch.userRoles)
        .where(eq(sch.userRoles.userId, params.id))
        .all()
        .map((r) => r.role);
      const wasAdmin = currentRoles.includes("admin");
      const staysAdmin = incoming.includes("admin");
      if (wasAdmin && !staysAdmin) {
        const otherAdmins = db
          .select()
          .from(sch.userRoles)
          .where(eq(sch.userRoles.role, "admin"))
          .all()
          .filter((r) => r.userId !== params.id);
        if (!otherAdmins.length) {
          set.status = 400;
          return { error: { code: 400, message: "Tidak bisa menghapus Admin terakhir" } };
        }
      }
      db.delete(sch.userRoles).where(eq(sch.userRoles.userId, params.id)).run();
      for (const role of incoming) {
        db.insert(sch.userRoles).values({ userId: params.id, role }).run();
      }
      return { ok: true, roles: incoming };
    },
    { body: t.Object({ roles: t.Array(t.String()) }) },
  )
  .post("/api/admin/users/:id/reset-password", async ({ user, params, set }) => {
    requireRole(user, ["admin"]);
    const target = db.select().from(sch.users).where(eq(sch.users.id, params.id)).get();
    if (!target) {
      set.status = 404;
      return { error: { code: 404, message: "Pengguna tidak ditemukan" } };
    }
    db.update(sch.users)
      .set({
        passwordHash: await hashPassword(DEFAULT_PASSWORD),
        mustChangePassword: 1,
        updatedAt: now(),
      })
      .where(eq(sch.users.id, params.id))
      .run();
    clearLoginAttemptsForEmail(target.email);
    return { temporaryPassword: DEFAULT_PASSWORD, defaultPassword: DEFAULT_PASSWORD };
  })
  .get("/api/admin/units", ({ user }) => {
    requireRole(user, ["admin", "leadership"]);
    return { data: db.select().from(sch.units).all() };
  })
  .post(
    "/api/admin/units",
    ({ user, body }) => {
      requireRole(user, ["admin"]);
      const row = {
        id: uid("unt"),
        code: body.code,
        name: body.name,
        level: body.level ?? "lainnya",
        parentUnitId: body.parentUnitId ?? null,
        isActive: 1,
        createdAt: now(),
        updatedAt: now(),
      };
      db.insert(sch.units).values(row).run();
      return { data: row };
    },
    {
      body: t.Object({
        code: t.String(),
        name: t.String(),
        level: t.Optional(t.String()),
        parentUnitId: t.Optional(t.String()),
      }),
    },
  )
  .get("/api/admin/periods/:id/assignments", ({ user, params }) => {
    requireRole(user, ["admin"]);
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, params.id))
      .all();
    const users = db.select().from(sch.users).all();
    return {
      data: assigns.map((a) => {
        const emp = users.find((u) => u.id === a.employeeId);
        const ass = users.find((u) => u.id === a.assessorId);
        return {
          ...a,
          employeeName: emp?.fullName,
          employeeNip: emp?.nip,
          employeeJabatan: emp?.jabatan,
          assessorName: ass?.fullName,
          assessorNip: ass?.nip,
        };
      }),
    };
  })
  .patch(
    "/api/admin/assignments/:id",
    ({ user, params, body, set }) => {
      requireRole(user, ["admin"]);
      const asg = db
        .select()
        .from(sch.assessmentAssignments)
        .where(eq(sch.assessmentAssignments.id, params.id))
        .get();
      if (!asg) {
        set.status = 404;
        return { error: { code: 404, message: "Assignment tidak ditemukan" } };
      }
      const assessorId = body.assessorId.trim();
      if (assessorId && assessorId === asg.employeeId) {
        set.status = 400;
        return { error: { code: 400, message: "Tidak boleh menilai diri sendiri" } };
      }
      db.update(sch.assessmentAssignments)
        .set({
          assessorId: assessorId || null,
          status: assessorId ? (asg.status === "unassigned" ? "pending" : asg.status) : "unassigned",
          updatedAt: now(),
        })
        .where(eq(sch.assessmentAssignments.id, params.id))
        .run();
      if (assessorId) {
        db.insert(sch.userRoles)
          .values({ userId: assessorId, role: "assessor" })
          .onConflictDoNothing()
          .run();
      }
      return { ok: true };
    },
    { body: t.Object({ assessorId: t.String() }) },
  )
  .post("/api/admin/periods/:id/notify", ({ user, params }) => {
    requireRole(user, ["admin"]);
    const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, params.id)).get();
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, params.id))
      .all()
      .filter((a) => a.status === "pending" || a.status === "draft");
    const ids = [...new Set(assigns.map((a) => a.assessorId).filter(Boolean))] as string[];
    for (const aid of ids) {
      notify({
        userId: aid,
        type: "deadline_reminder",
        periodId: params.id,
        subject: "Pengingat penilaian",
        body: `Masih ada penilaian pending untuk ${period?.name ?? "periode ini"}.`,
      });
    }
    return { sent: ids.length };
  })
  .get("/api/admin/periods/:id/import-template", async ({ user, params, set }) => {
    requireRole(user, ["admin"]);
    const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, params.id)).get();
    if (!period) {
      set.status = 404;
      return { error: { code: 404, message: "Periode tidak ditemukan" } };
    }
    const buf = await buildImportTemplate(period.name);
    const filename = `template-import-pegawai-${period.name.replaceAll(" ", "-")}.xlsx`;
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  })
  .post("/api/admin/periods/:id/import", async ({ user, params, request, set }) => {
    requireRole(user, ["admin"]);
    const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, params.id)).get();
    if (!period) {
      set.status = 404;
      return { error: { code: 404, message: "Periode tidak ditemukan" } };
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      set.status = 400;
      return { error: { code: 400, message: "File Excel/CSV wajib" } };
    }
    let rows: string[][];
    try {
      rows = await parseImportFile(file);
    } catch (e) {
      set.status = 400;
      return { error: { code: 400, message: (e as Error).message } };
    }
    const header = rows[0];
    if (!headerMatches(header)) {
      set.status = 400;
      return { error: { code: 400, message: "Gunakan template resmi. Header baris 1 harus: NIP, Nama, PangkatGolongan, UnitKode, UnitNama, Jabatan, Email, NIP_Atasan" } };
    }
    const errors: string[] = [];
    let created = 0;
    const findByNip = (target: string) => db.select().from(sch.users).all().find((u) => nipsMatch(u.nip, target));

    type ParsedRow = {
      line: number;
      nip: string;
      nama: string;
      pangkat: string;
      unitKode: string;
      unitNama: string;
      jabatan: string;
      email: string;
      nipAtasan: string;
    };
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const [nipRaw, nama, pangkat, unitKode, unitNama, jabatan, email, nipAtasanRaw] = rows[i];
      const nip = normalizeNip(nipRaw);
      if (!/^\d{17,18}$/.test(nip)) {
        errors.push(`Baris ${i + 1}: NIP harus 17–18 digit`);
        continue;
      }
      if (!email?.includes("@")) {
        errors.push(`Baris ${i + 1}: email tidak valid`);
        continue;
      }
      parsed.push({
        line: i + 1,
        nip,
        nama: nama ?? "",
        pangkat: pangkat ?? "",
        unitKode: unitKode ?? "",
        unitNama: unitNama ?? "",
        jabatan: jabatan ?? "",
        email: email.toLowerCase(),
        nipAtasan: normalizeNip(nipAtasanRaw),
      });
    }

    const empByNip = new Map<string, string>();
    let ok = 0;
    for (const row of parsed) {
      let unit = db.select().from(sch.units).where(eq(sch.units.code, row.unitKode)).get();
      if (!unit) {
        unit = {
          id: uid("unt"),
          code: row.unitKode,
          name: row.unitNama || row.unitKode,
          level: "lainnya",
          parentUnitId: null,
          isActive: 1,
          createdAt: now(),
          updatedAt: now(),
        };
        db.insert(sch.units).values(unit).run();
      }
      let emp = findByNip(row.nip);
      const emailOwner = db.select().from(sch.users).where(eq(sch.users.email, row.email)).get();
      if (emailOwner && emp && emailOwner.id !== emp.id) {
        errors.push(`Baris ${row.line}: email sudah dipakai NIP lain`);
        continue;
      }
      if (emailOwner && !emp && !nipsMatch(emailOwner.nip, row.nip)) {
        errors.push(`Baris ${row.line}: email sudah dipakai NIP lain`);
        continue;
      }
      if (!emp) {
        emp = {
          id: uid("usr"),
          email: row.email,
          username: row.email,
          passwordHash: await hashPassword(DEFAULT_PASSWORD),
          fullName: row.nama,
          nip: row.nip,
          pangkatGolongan: row.pangkat || null,
          jabatan: row.jabatan || null,
          unitId: unit.id,
          isActive: 1,
          mustChangePassword: 1,
          lastLogin: null,
          createdAt: now(),
          updatedAt: now(),
        };
        db.insert(sch.users).values(emp).run();
        db.insert(sch.userRoles).values({ userId: emp.id, role: "employee" }).run();
        created += 1;
      } else {
        db.update(sch.users)
          .set({
            fullName: row.nama,
            pangkatGolongan: row.pangkat || null,
            jabatan: row.jabatan || null,
            unitId: unit.id,
            email: row.email,
            updatedAt: now(),
          })
          .where(eq(sch.users.id, emp.id))
          .run();
      }
      empByNip.set(row.nip, emp.id);
      ok += 1;
      const existing = db
        .select()
        .from(sch.assessmentAssignments)
        .where(
          and(
            eq(sch.assessmentAssignments.periodId, period.id),
            eq(sch.assessmentAssignments.employeeId, emp.id),
          ),
        )
        .get();
      if (existing) {
        db.update(sch.assessmentAssignments)
          .set({ unitId: unit.id, updatedAt: now() })
          .where(eq(sch.assessmentAssignments.id, existing.id))
          .run();
      } else {
        db.insert(sch.assessmentAssignments)
          .values({
            id: uid("asg"),
            periodId: period.id,
            employeeId: emp.id,
            assessorId: null,
            unitId: unit.id,
            status: "unassigned",
            createdAt: now(),
            updatedAt: now(),
          })
          .run();
      }
    }

    for (const row of parsed) {
      const empId = empByNip.get(row.nip);
      if (!empId) continue;
      let assessorId: string | null = null;
      if (row.nipAtasan) {
        if (!/^\d{17,18}$/.test(row.nipAtasan)) {
          errors.push(`Baris ${row.line}: NIP_Atasan harus 17–18 digit`);
        } else {
          const atasan = findByNip(row.nipAtasan);
          if (!atasan) {
            errors.push(
              `Baris ${row.line}: NIP_Atasan ${row.nipAtasan} tidak ada di kolom NIP — atasan harus nama pegawai yang NIP-nya sama`,
            );
          } else if (atasan.id === empId) {
            errors.push(`Baris ${row.line}: NIP_Atasan tidak boleh NIP pegawai itu sendiri`);
          } else {
            assessorId = atasan.id;
            db.insert(sch.userRoles)
              .values({ userId: atasan.id, role: "assessor" })
              .onConflictDoNothing()
              .run();
          }
        }
      }
      const existing = db
        .select()
        .from(sch.assessmentAssignments)
        .where(
          and(eq(sch.assessmentAssignments.periodId, period.id), eq(sch.assessmentAssignments.employeeId, empId)),
        )
        .get();
      if (!existing) continue;
      db.update(sch.assessmentAssignments)
        .set({
          assessorId,
          status: assessorId ? (existing.status === "unassigned" ? "pending" : existing.status) : "unassigned",
          updatedAt: now(),
        })
        .where(eq(sch.assessmentAssignments.id, existing.id))
        .run();
    }

    return { imported: ok, errors, created, defaultPassword: DEFAULT_PASSWORD };
  })
  .get("/api/admin/master", ({ user }) => {
    requireRole(user, ["admin", "assessor", "employee", "leadership"]);
    return {
      nilaiDasar: db.select().from(sch.nilaiDasar).all(),
      panduan: db.select().from(sch.panduanPerilaku).all(),
      barsLevels: db.select().from(sch.barsLevels).all(),
      anchors: db.select().from(sch.barsAnchors).all(),
      feedbackTemplates: db.select().from(sch.feedbackTemplates).all(),
      budayaKerja: db.select().from(sch.budayaKerja).all(),
    };
  })
  .patch(
    "/api/admin/master/nilai-dasar/:id",
    ({ user, params, body }) => {
      requireRole(user, ["admin"]);
      db.update(sch.nilaiDasar)
        .set({ name: body.name, description: body.description, updatedAt: now(), updatedBy: user!.id })
        .where(eq(sch.nilaiDasar.id, params.id))
        .run();
      db.insert(sch.masterDataAudit)
        .values({
          id: uid("aud"),
          tableName: "nilai_dasar",
          recordId: params.id,
          action: "update",
          changedFields: JSON.stringify(body),
          changedBy: user!.id,
          changedAt: now(),
        })
        .run();
      return { ok: true };
    },
    { body: t.Object({ name: t.String(), description: t.String() }) },
  )
  .patch(
    "/api/admin/master/feedback-templates/:id",
    ({ user, params, body }) => {
      requireRole(user, ["admin"]);
      if (body.templateText.length > 300) {
        throw Object.assign(new Error("Max 300 karakter"), { status: 400 });
      }
      db.update(sch.feedbackTemplates)
        .set({ templateText: body.templateText })
        .where(eq(sch.feedbackTemplates.id, params.id))
        .run();
      return { ok: true };
    },
    { body: t.Object({ templateText: t.String() }) },
  )
  .patch(
    "/api/admin/master/bars-anchors/:id",
    ({ user, params, body }) => {
      requireRole(user, ["admin"]);
      db.update(sch.barsAnchors)
        .set({ anchorText: body.anchorText })
        .where(eq(sch.barsAnchors.id, params.id))
        .run();
      return { ok: true };
    },
    { body: t.Object({ anchorText: t.String() }) },
  )
  .get("/api/admin/reports/aggregated", ({ user, query }) => {
    requireRole(user, ["admin", "leadership"]);
    return aggregatedReport(user!, query.periodId as string | undefined);
  })
  .get("/api/admin/reports/audit", ({ user }) => {
    requireRole(user, ["admin"]);
    return {
      assessments: db.select().from(sch.assessmentHistory).orderBy(desc(sch.assessmentHistory.createdAt)).all().slice(0, 200),
      master: db.select().from(sch.masterDataAudit).orderBy(desc(sch.masterDataAudit.changedAt)).all().slice(0, 200),
    };
  })
  .get("/api/admin/reports/export", ({ user, query, set }) => {
    requireRole(user, ["admin", "leadership"]);
    const report = aggregatedReport(user!, query.periodId as string | undefined);
    set.headers["Content-Type"] = "text/csv; charset=utf-8";
    set.headers["Content-Disposition"] = "attachment; filename=laporan.csv";
    const lines = ["Unit,Jumlah,Rata-rata 120,Eksekusi,Cara Kerja,Pelayanan"];
    for (const u of report.byUnit) {
      lines.push(`${u.unitName},${u.count},${u.avg120},${u.ee},${u.ck},${u.pu}`);
    }
    return lines.join("\n");
  })
  .get("/api/assessor/employees", ({ user, query }) => {
    requireRole(user, ["assessor", "admin"]);
    const periodId = resolvePeriodId(query.periodId as string | undefined);
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, periodId))
      .all()
      .filter((a) => a.assessorId === user!.id);
    const users = db.select().from(sch.users).all();
    const assessments = db.select().from(sch.assessments).where(eq(sch.assessments.periodId, periodId)).all();
    return {
      periodId,
      data: assigns.map((a) => {
        const emp = users.find((u) => u.id === a.employeeId);
        const as = assessments.find((x) => x.assignmentId === a.id);
        return {
          ...a,
          employeeName: emp?.fullName,
          nip: emp?.nip,
          jabatan: emp?.jabatan,
          scoreScale120: as && as.status !== "draft" ? as.scoreScale120 : null,
          budayaEksekusiEfektif: as && as.status !== "draft" ? as.budayaEksekusiEfektif : null,
          budayaCaraKerjaBaru: as && as.status !== "draft" ? as.budayaCaraKerjaBaru : null,
          budayaPelayananUnggul: as && as.status !== "draft" ? as.budayaPelayananUnggul : null,
          submittedAt: as?.submittedAt ?? null,
        };
      }),
    };
  })
  .get("/api/assessor/assignments/:id/form", ({ user, params, set }) => {
    requireRole(user, ["assessor", "admin"]);
    const asg = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.id, params.id))
      .get();
    if (!asg || asg.assessorId !== user!.id) {
      set.status = 403;
      return { error: { code: 403, message: "Bukan pegawai binaan Anda" } };
    }
    const emp = db.select().from(sch.users).where(eq(sch.users.id, asg.employeeId)).get();
    const existing = db
      .select()
      .from(sch.assessments)
      .where(eq(sch.assessments.assignmentId, asg.id))
      .get();
    return {
      assignment: asg,
      employee: emp ? { id: emp.id, fullName: emp.fullName, nip: emp.nip, jabatan: emp.jabatan } : null,
      assessment: existing ? publicAssessment(existing, false) : null,
    };
  })
  .post(
    "/api/assessor/assessments",
    ({ user, body, set, ip }) => {
      requireRole(user, ["assessor", "admin"]);
      const asg = db
        .select()
        .from(sch.assessmentAssignments)
        .where(eq(sch.assessmentAssignments.id, body.assignmentId))
        .get();
      if (!asg || asg.assessorId !== user!.id) {
        set.status = 403;
        return { error: { code: 403, message: "Forbidden" } };
      }
      const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, asg.periodId)).get();
      if (!period || period.status !== "active") {
        set.status = 400;
        return { error: { code: 400, message: "Periode tidak aktif" } };
      }
      const scores = body.scores as AssessmentScores;
      let calc;
      try {
        calc = calculateScores(scores);
      } catch (e) {
        set.status = 400;
        return { error: { code: 400, message: (e as Error).message } };
      }
      const existing = db
        .select()
        .from(sch.assessments)
        .where(eq(sch.assessments.assignmentId, asg.id))
        .get();
      const status =
        body.action === "draft" ? "draft" : existing && existing.status !== "draft" ? "revised" : "submitted";
      const ts = now();
      const payload = {
        assignmentId: asg.id,
        periodId: asg.periodId,
        employeeId: asg.employeeId,
        assessorId: user!.id,
        nilaiBp: scores.BP,
        nilaiAk: scores.AK,
        nilaiKp: scores.KP,
        nilaiHm: scores.HM,
        nilaiLy: scores.LY,
        nilaiAd: scores.AD,
        nilaiKb: scores.KB,
        totalScore: calc.totalScore,
        scoreScale120: calc.scoreScale120,
        budayaEksekusiEfektif: calc.budayaEksekusiEfektif,
        budayaCaraKerjaBaru: calc.budayaCaraKerjaBaru,
        budayaPelayananUnggul: calc.budayaPelayananUnggul,
        additionalFeedback: body.additionalFeedback ?? null,
        status,
        submittedAt: body.action === "draft" ? existing?.submittedAt ?? null : ts,
        revisedAt: status === "revised" ? ts : existing?.revisedAt ?? null,
        updatedAt: ts,
      };
      let assessmentId = existing?.id ?? uid("asm");
      if (existing) {
        db.update(sch.assessments).set(payload).where(eq(sch.assessments.id, existing.id)).run();
        db.delete(sch.assessmentFeedbacks).where(eq(sch.assessmentFeedbacks.assessmentId, existing.id)).run();
      } else {
        db.insert(sch.assessments)
          .values({ id: assessmentId, createdAt: ts, ...payload })
          .run();
      }
      const templates = db.select().from(sch.feedbackTemplates).all();
      for (const code of NILAI_CODES) {
        const nid = CODE_TO_ID[code];
        const level = scores[code];
        const tpl = templates.find((x) => x.nilaiDasarId === nid && x.level === level)?.templateText ?? "";
        const incoming = body.feedbacks?.find((f) => f.nilaiDasarCode === code);
        const finalText = (incoming?.finalText ?? tpl).slice(0, 300);
        db.insert(sch.assessmentFeedbacks)
          .values({
            id: uid("afb"),
            assessmentId,
            nilaiDasarId: nid,
            level,
            templateText: tpl,
            finalText,
            isEdited: finalText !== tpl ? 1 : 0,
            includeForEmployee: incoming?.includeForEmployee === false ? 0 : 1,
          })
          .run();
      }
      db.update(sch.assessmentAssignments)
        .set({ status, updatedAt: ts })
        .where(eq(sch.assessmentAssignments.id, asg.id))
        .run();
      db.insert(sch.assessmentHistory)
        .values({
          id: uid("hst"),
          assessmentId,
          action: status,
          changedBy: user!.id,
          changeDetails: JSON.stringify({ scores, status }),
          ipAddress: ip,
          createdAt: ts,
        })
        .run();
      if (body.action === "submit") {
        notify({
          userId: asg.employeeId,
          type: status === "revised" ? "result_revised" : "result_ready",
          periodId: asg.periodId,
          subject: status === "revised" ? "Penilaian diperbarui" : "Hasil penilaian tersedia",
          body: `Penilaian periode telah ${status === "revised" ? "direvisi" : "disubmit"}.`,
        });
      }
      const saved = db.select().from(sch.assessments).where(eq(sch.assessments.id, assessmentId)).get()!;
      return { data: publicAssessment(saved, false) };
    },
    {
      body: t.Object({
        assignmentId: t.String(),
        action: t.Union([t.Literal("draft"), t.Literal("submit")]),
        scores: t.Record(t.String(), t.Number()),
        feedbacks: t.Optional(
          t.Array(
            t.Object({
              nilaiDasarCode: t.String(),
              finalText: t.String(),
              includeForEmployee: t.Boolean(),
            }),
          ),
        ),
        additionalFeedback: t.Optional(t.String()),
      }),
    },
  )
  .get("/api/employee/dashboard", ({ user }) => {
    requireRole(user, ["employee", "admin", "assessor", "leadership"]);
    const period = activePeriod();
    const asg = period
      ? db
          .select()
          .from(sch.assessmentAssignments)
          .where(
            and(
              eq(sch.assessmentAssignments.periodId, period.id),
              eq(sch.assessmentAssignments.employeeId, user!.id),
            ),
          )
          .get()
      : null;
    const assessment = asg
      ? db.select().from(sch.assessments).where(eq(sch.assessments.assignmentId, asg.id)).get()
      : null;
    const assessor = asg?.assessorId
      ? db.select().from(sch.users).where(eq(sch.users.id, asg.assessorId)).get()
      : null;
    const visible = assessment && assessment.status !== "draft" ? publicAssessment(assessment, true) : null;
    return {
      period,
      assignment: asg,
      assessorName: assessor?.fullName ?? null,
      assessment: visible,
    };
  })
  .get("/api/employee/assessments/history", ({ user }) => {
    requireRole(user, ["employee", "admin", "assessor", "leadership"]);
    const rows = db
      .select()
      .from(sch.assessments)
      .where(eq(sch.assessments.employeeId, user!.id))
      .all()
      .filter((r) => r.status !== "draft");
    const periods = db.select().from(sch.assessmentPeriods).all();
    return {
      data: rows.map((r) => ({
        ...publicAssessment(r, true),
        periodName: periods.find((p) => p.id === r.periodId)?.name,
      })),
    };
  })
  .get("/api/employee/assessments/:id", ({ user, params, set }) => {
    requireRole(user, ["employee", "admin", "assessor", "leadership"]);
    const row = db.select().from(sch.assessments).where(eq(sch.assessments.id, params.id)).get();
    if (!row || row.employeeId !== user!.id || row.status === "draft") {
      set.status = 404;
      return { error: { code: 404, message: "Tidak ditemukan" } };
    }
    return { data: publicAssessment(row, true) };
  })
  .get("/api/leadership/dashboard", ({ user, query }) => {
    requireRole(user, ["leadership", "admin"]);
    return aggregatedReport(user!, query.periodId as string | undefined);
  })
  .get("/api/leadership/units/:unitId/employees", ({ user, params, query, set }) => {
    requireRole(user, ["leadership", "admin"]);
    const periodId = resolvePeriodId(query.periodId as string | undefined);
    if (!hasRole(user!, "admin")) {
      const allowed = user!.unitId ? descendantUnitIds(user!.unitId) : new Set<string>();
      if (!allowed.has(params.unitId)) {
        set.status = 403;
        return { error: { code: 403, message: "Di luar unit Anda" } };
      }
    }
    const assigns = db
      .select()
      .from(sch.assessmentAssignments)
      .where(eq(sch.assessmentAssignments.periodId, periodId))
      .all()
      .filter((a) => a.unitId === params.unitId);
    const users = db.select().from(sch.users).all();
    const assessments = db.select().from(sch.assessments).where(eq(sch.assessments.periodId, periodId)).all();
    return {
      data: assigns.map((a) => {
        const emp = users.find((u) => u.id === a.employeeId);
        const as = assessments.find((x) => x.assignmentId === a.id && x.status !== "draft");
        return {
          employeeId: a.employeeId,
          name: emp?.fullName,
          nip: emp?.nip,
          status: a.status,
          scoreScale120: as?.scoreScale120 ?? null,
          kategori: as ? getCategory(as.scoreScale120) : null,
          budayaEksekusiEfektif: as?.budayaEksekusiEfektif ?? null,
          budayaCaraKerjaBaru: as?.budayaCaraKerjaBaru ?? null,
          budayaPelayananUnggul: as?.budayaPelayananUnggul ?? null,
        };
      }),
    };
  })
  .listen(Number(process.env.PORT ?? 3000));

function activePeriod() {
  return db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.status, "active")).get()
    ?? db.select().from(sch.assessmentPeriods).orderBy(desc(sch.assessmentPeriods.year)).all()[0]
    ?? null;
}

function resolvePeriodId(explicit?: string) {
  if (explicit) return explicit;
  const p = activePeriod();
  if (!p) throw Object.assign(new Error("Tidak ada periode"), { status: 400 });
  return p.id;
}

function aggregatedReport(user: SessionUser, periodId?: string) {
  const pid = resolvePeriodId(periodId);
  const period = db.select().from(sch.assessmentPeriods).where(eq(sch.assessmentPeriods.id, pid)).get();
  let assigns = db
    .select()
    .from(sch.assessmentAssignments)
    .where(eq(sch.assessmentAssignments.periodId, pid))
    .all();
  if (!hasRole(user, "admin") && user.unitId) {
    const allowed = descendantUnitIds(user.unitId);
    assigns = assigns.filter((a) => allowed.has(a.unitId));
  }
  const assessments = db
    .select()
    .from(sch.assessments)
    .where(eq(sch.assessments.periodId, pid))
    .all()
    .filter((a) => a.status !== "draft");
  const byAssignment = new Map(assessments.map((a) => [a.assignmentId, a]));
  const units = db.select().from(sch.units).all();
  const submitted = assigns.filter((a) => byAssignment.has(a.id));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : 0);
  const scores = submitted.map((a) => byAssignment.get(a.id)!);
  const byUnit = units
    .map((u) => {
      const list = submitted.filter((a) => a.unitId === u.id).map((a) => byAssignment.get(a.id)!);
      if (!list.length) return null;
      return {
        unitId: u.id,
        unitName: u.name,
        count: list.length,
        totalAssigned: assigns.filter((a) => a.unitId === u.id).length,
        avg120: Math.round(avg(list.map((x) => x.scoreScale120)) * 100) / 100,
        ee: Math.round(avg(list.map((x) => x.budayaEksekusiEfektif)) * 100) / 100,
        ck: Math.round(avg(list.map((x) => x.budayaCaraKerjaBaru)) * 100) / 100,
        pu: Math.round(avg(list.map((x) => x.budayaPelayananUnggul)) * 100) / 100,
        kategori: getCategory(avg(list.map((x) => x.scoreScale120))),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.avg120 ?? 0) - (a!.avg120 ?? 0));

  const dist = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: scores.filter((s) => Math.round(s.totalScore / 7) === level).length,
  }));

  return {
    period,
    totalAssigned: assigns.length,
    done: submitted.length,
    percent: assigns.length ? Math.round((submitted.length / assigns.length) * 100) : 0,
    avg120: Math.round(avg(scores.map((s) => s.scoreScale120)) * 100) / 100,
    avgEE: Math.round(avg(scores.map((s) => s.budayaEksekusiEfektif)) * 100) / 100,
    avgCK: Math.round(avg(scores.map((s) => s.budayaCaraKerjaBaru)) * 100) / 100,
    avgPU: Math.round(avg(scores.map((s) => s.budayaPelayananUnggul)) * 100) / 100,
    kategori: getCategory(avg(scores.map((s) => s.scoreScale120))),
    byUnit,
    distribution: dist,
  };
}

console.log(`API running at http://localhost:${app.server?.port}`);
