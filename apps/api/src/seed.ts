import {
  ANCHORS,
  BARS_LEVELS,
  BUDAYA_KERJA,
  CODE_TO_ID,
  FEEDBACKS,
  NILAI_CODES,
  NILAI_DASAR,
  PANDUAN,
} from "@app/shared";
import { db } from "./db";
import { migrate } from "./migrate";
import * as t from "./schema";
import { hashPassword } from "./util";

const now = () => Math.floor(Date.now() / 1000);
const id = (p: string) => `${p}_${crypto.randomUUID().slice(0, 8)}`;

export async function seed(force = false) {
  migrate();
  const existing = db.select().from(t.users).all();
  if (existing.length && !force) return { seeded: false };

  const ts = now();
  const passwordHash = await hashPassword("Password1");

  db.insert(t.systemSettings)
    .values({
      id: "default",
      organizationName: "Kementerian Kesehatan RI",
      primaryColor: "#185FA5",
    })
    .onConflictDoNothing()
    .run();

  for (const n of NILAI_DASAR) {
    db.insert(t.nilaiDasar)
      .values({ ...n, updatedAt: ts })
      .onConflictDoNothing()
      .run();
  }
  for (const p of PANDUAN) {
    db.insert(t.panduanPerilaku)
      .values({
        id: `panduan_${p.nilaiDasarId}_${p.sequence}`,
        ...p,
        description: p.title,
      })
      .onConflictDoNothing()
      .run();
  }
  for (const b of BARS_LEVELS) {
    db.insert(t.barsLevels).values({ ...b }).onConflictDoNothing().run();
  }
  for (const code of NILAI_CODES) {
    const nid = CODE_TO_ID[code];
    for (let level = 1; level <= 5; level++) {
      db.insert(t.barsAnchors)
        .values({
          id: `anchor_${code}_${level}`,
          nilaiDasarId: nid,
          level,
          anchorText: ANCHORS[code][level - 1],
        })
        .onConflictDoNothing()
        .run();
      db.insert(t.feedbackTemplates)
        .values({
          id: `fb_${code}_${level}`,
          nilaiDasarId: nid,
          level,
          templateText: FEEDBACKS[code][level - 1],
        })
        .onConflictDoNothing()
        .run();
    }
  }
  for (const b of BUDAYA_KERJA) {
    db.insert(t.budayaKerja).values(b).onConflictDoNothing().run();
  }

  const unitKinerja = {
    id: "unit_kinerja",
    code: "SK-KIN",
    name: "Seksi Kinerja",
    level: "seksi",
    parentUnitId: null,
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };
  const unitSdm = {
    id: "unit_sdm",
    code: "BAG-SDM",
    name: "Bagian SDM",
    level: "bagian",
    parentUnitId: null,
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };
  db.insert(t.units).values(unitKinerja).onConflictDoNothing().run();
  db.insert(t.units).values(unitSdm).onConflictDoNothing().run();

  const demoUsers = [
    {
      id: "user_anik",
      email: "anik@kemkes.go.id",
      nip: "19750105199203001",
      fullName: "Anik Sri Handayani",
      jabatan: "Kepala Seksi",
      unitId: "unit_kinerja",
      roles: ["admin", "assessor", "employee", "leadership"] as const,
    },
    {
      id: "user_arif",
      email: "arif.mujaki@kemkes.go.id",
      nip: "19870217200912001",
      fullName: "Mohamad Arif Mujaki",
      jabatan: "Analis Kinerja",
      unitId: "unit_kinerja",
      roles: ["assessor", "employee"] as const,
    },
    {
      id: "user_ani",
      email: "ani.suryani@kemkes.go.id",
      nip: "19800605200812002",
      fullName: "Ani Suryani",
      jabatan: "Analyst",
      unitId: "unit_kinerja",
      roles: ["employee"] as const,
    },
    {
      id: "user_budi",
      email: "budi.santoso@kemkes.go.id",
      nip: "19650312197803001",
      fullName: "Budi Santoso",
      jabatan: "Kepala Bagian",
      unitId: "unit_sdm",
      roles: ["assessor", "employee", "leadership"] as const,
    },
  ];

  for (const u of demoUsers) {
    db.insert(t.users)
      .values({
        id: u.id,
        email: u.email,
        username: u.email,
        passwordHash,
        fullName: u.fullName,
        nip: u.nip,
        jabatan: u.jabatan,
        unitId: u.unitId,
        isActive: 1,
        mustChangePassword: 0,
        createdAt: ts,
        updatedAt: ts,
      })
      .onConflictDoNothing()
      .run();
    for (const role of u.roles) {
      db.insert(t.userRoles)
        .values({ userId: u.id, role })
        .onConflictDoNothing()
        .run();
    }
  }

  const periodId = "period_q1_2026";
  db.insert(t.assessmentPeriods)
    .values({
      id: periodId,
      name: "Q1 2026",
      quarter: "Q1",
      year: 2026,
      startDate: Date.parse("2026-01-01") / 1000,
      endDate: Date.parse("2026-03-31") / 1000,
      deadlineDate: Date.parse("2026-04-30") / 1000,
      status: "active",
      description: "Periode demo",
      createdAt: ts,
      updatedAt: ts,
    })
    .onConflictDoNothing()
    .run();

  const assigns = [
    { id: "asg_arif", employeeId: "user_arif", assessorId: "user_anik", unitId: "unit_kinerja" },
    { id: "asg_ani", employeeId: "user_ani", assessorId: "user_arif", unitId: "unit_kinerja" },
    { id: "asg_anik", employeeId: "user_anik", assessorId: "user_budi", unitId: "unit_kinerja" },
    { id: "asg_budi", employeeId: "user_budi", assessorId: "user_anik", unitId: "unit_sdm" },
  ];
  for (const a of assigns) {
    db.insert(t.assessmentAssignments)
      .values({
        ...a,
        periodId,
        status: "pending",
        createdAt: ts,
        updatedAt: ts,
      })
      .onConflictDoNothing()
      .run();
  }

  return { seeded: true };
}

if (import.meta.main) {
  const result = await seed(false);
  console.log(result);
}
