/**
 * seed.ts — Inisialisasi Data Demo
 *
 * Berisi fungsi untuk mengisi database dengan data demo saat pertama kali dijalankan.
 * Data yang di-seed meliputi:
 * 1. Pengaturan sistem (nama organisasi)
 * 2. Master data BerAKHLAK (nilai dasar, panduan, jangkar BARS, feedback)
 * 3. Unit organisasi (2 unit demo)
 * 4. Pengguna demo (4 orang dengan berbagai peran)
 * 5. Periode penilaian aktif (Q1 2026)
 * 6. Penugasan penilaian (4 assignment)
 *
 * CATATAN: Data ini hanya untuk keperluan demo/development.
 * Di production, data master sudah ada dari awal (tidak perlu seed).
 */

import {
  ANCHORS,
  BARS_LEVELS,
  BUDAYA_KERJA,
  CODE_TO_ID,
  FEEDBACKS,
  NILAI_CODES,
  NILAI_DASAR,
  PANDUAN,
  UnitLevel,
} from "@app/shared";
import { db } from "./db";
import { migrate } from "./migrate";
import * as t from "./schema";
import { hashPassword } from "./util";

// Helper: timestamp saat ini
const now = () => Math.floor(Date.now() / 1000);

// Helper: generate ID dengan prefix + 8 karakter random
const id = (p: string) => `${p}_${crypto.randomUUID().slice(0, 8)}`;

/**
 * Fungsi utama seed data.
 *
 * @param force - Jika true, seed ulang meskipun sudah ada data
 * @returns Object { seeded: boolean } - true jika seed berhasil, false jika sudah ada data
 */
export async function seed(force = false) {
  // Jalankan migrasi tabel terlebih dahulu
  migrate();

  // Cek apakah sudah ada data pengguna
  const existing = db.select().from(t.users).all();
  if (existing.length && !force) return { seeded: false };

  const ts = now();
  const passwordHash = await hashPassword("Password1");

  // ==================== 1. PENGATURAN SISTEM ====================
  db.insert(t.systemSettings)
    .values({
      id: "default",
      organizationName: "Kementerian Kesehatan RI",
      primaryColor: "#185FA5",
    })
    .onConflictDoNothing()
    .run();

  // ==================== 2. MASTER DATA BERAKHLAK ====================

  // Seed 7 nilai dasar
  for (const n of NILAI_DASAR) {
    db.insert(t.nilaiDasar)
      .values({ ...n, updatedAt: ts })
      .onConflictDoNothing()
      .run();
  }

  // Seed 21 panduan perilaku (3 per nilai dasar)
  for (const p of PANDUAN) {
    db.insert(t.panduanPerilaku)
      .values({
        id: `panduan_${p.nilaiDasarId}_${p.sequence}`,
        ...p,
        description: p.title, // Deskripsi = judul (untuk seed)
      })
      .onConflictDoNothing()
      .run();
  }

  // Seed 5 level BARS
  for (const b of BARS_LEVELS) {
    db.insert(t.barsLevels).values({ ...b }).onConflictDoNothing().run();
  }

  // Seed 35 jangkar BARS + 35 template feedback (5 per nilai dasar)
  for (const code of NILAI_CODES) {
    const nid = CODE_TO_ID[code]; // Konversi kode ke ID database
    for (let level = 1; level <= 5; level++) {
      // Jangkar BARS
      db.insert(t.barsAnchors)
        .values({
          id: `anchor_${code}_${level}`,
          nilaiDasarId: nid,
          level,
          anchorText: ANCHORS[code][level - 1],
        })
        .onConflictDoNothing()
        .run();

      // Template feedback
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

  // Seed 3 dimensi budaya kerja
  for (const b of BUDAYA_KERJA) {
    db.insert(t.budayaKerja).values(b).onConflictDoNothing().run();
  }

  // ==================== 3. UNIT ORGANISASI ====================

  /**
   * Struktur hierarki unit Kementerian Kesehatan:
   *
   * Sekretariat Jenderal (Unit Eselon 1)
   *   ├── Biro Organisasi dan SDM (Unit Kerja)
   *   │   ├── Tim Kerja Pengelolaan Kinerja Pegawai ASN
   *   │   ├── Tim Kerja Sistem Informasi ASN
   *   │   └── Tim Kerja Dukungan Manajemen
   *   ├── Biro Umum (Unit Kerja)
   *   │   ├── Tim Kerja Gaji
   *   │   ├── Tim Kerja Change Management
   *   │   └── Tim Kerja Dukungan Manajemen dan Rumah Tangga
   *   └── Pusat Pengembangan Kompetensi Aparatur (Unit Kerja)
   *       ├── Tim Kerja Budaya Kerja
   *       └── Tim Kerja Dukungan Manajemen
   */

  // Level 1: Sekretariat Jenderal (Unit Eselon 1)
  const unitSekjen = {
    id: "unit_sekjen",
    code: "ESL-I",
    name: "Sekretariat Jenderal",
    level: UnitLevel.ESELON_1,
    parentUnitId: null,
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Level 2: Biro Organisasi dan SDM
  const unitBiroSDM = {
    id: "unit_biro_sdm",
    code: "OSDM",
    name: "Biro Organisasi dan SDM",
    level: UnitLevel.UNIT_KERJA,
    parentUnitId: "unit_sekjen",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Level 2: Biro Umum
  const unitBiroUmum = {
    id: "unit_biro_umum",
    code: "ROUM",
    name: "Biro Umum",
    level: UnitLevel.UNIT_KERJA,
    parentUnitId: "unit_sekjen",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Level 2: Pusat Pengembangan Kompetensi Aparatur
  const unitPuskom = {
    id: "unit_p2ka",
    code: "P2KA",
    name: "Pusat Pengembangan Kompetensi Aparatur",
    level: UnitLevel.UNIT_KERJA,
    parentUnitId: "unit_sekjen",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Level 3: Tim Kerja di Biro Organisasi dan SDM
  const unitTimKinerja = {
    id: "unit_tim_kinerja",
    code: "TK-PKP",
    name: "Tim Kerja Pengelolaan Kinerja Pegawai ASN",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_sdm",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  const unitTimSI = {
    id: "unit_tim_si",
    code: "TK-SIASN",
    name: "Tim Kerja Sistem Informasi ASN",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_sdm",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  const unitTimDukManBiroSDM = {
    id: "unit_tim_dukman_biro_sdm",
    code: "TK-DM-OSDM",
    name: "Tim Kerja Dukungan Manajemen",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_sdm",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };


  // Level 3: Tim Kerja di Biro Umum
  const unitTimGaji = {
    id: "unit_tim_gaji",
    code: "TK-GJI",
    name: "Tim Kerja Gaji",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_umum",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  const unitTimCM = {
    id: "unit_tim_cm",
    code: "TK-CM",
    name: "Tim Kerja Change Management",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_umum",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  const unitTimDukManUmum = {
    id: "unit_tim_dukman_umum",
    code: "TK-DM-UMM",
    name: "Tim Kerja Dukungan Manajemen dan Rumah Tangga",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_biro_umum",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Level 3: Tim Kerja di Pusat Pengembangan Kompetensi
  const unitTimBudayaKerja = {
    id: "unit_tim_budaya",
    code: "TK-BDK",
    name: "Tim Kerja Budaya Kerja",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_p2ka",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  const unitTimDukManPuskom = {
    id: "unit_tim_dukman_puskom",
    code: "TK-DM-PUS",
    name: "Tim Kerja Dukungan Manajemen",
    level: UnitLevel.TIM_KERJA,
    parentUnitId: "unit_p2ka",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  // Insert semua unit
  const allUnits = [
    unitSekjen,
    unitBiroSDM, unitBiroUmum, unitPuskom,
    unitTimKinerja, unitTimSI, unitTimDukManBiroSDM,
    unitTimGaji, unitTimCM, unitTimDukManUmum,
    unitTimBudayaKerja, unitTimDukManPuskom,
  ];
  for (const u of allUnits) {
    db.insert(t.units).values(u).onConflictDoNothing().run();
  }

  // ==================== 4. PENGGUNA DEMO ====================

  /**
   * Struktur pengguna demo:
   *
   * Admin Utama (admin@demo.go.id)
   *   - Role: admin, assessor, employee, leadership
   *   - Unit: Biro Organisasi dan SDM
   *   - Menilai: Kepala Tim Kerja Pengelolaan Kinerja
   *
   * Budi Pratama (penilai@demo.go.id)
   *   - Role: assessor, employee
   *   - Unit: Tim Kerja Pengelolaan Kinerja Pegawai ASN
   *   - Menilai: Siti Rahayu (di tim yang sama)
   *
   * Siti Rahayu (pegawai@demo.go.id)
   *   - Role: employee
   *   - Unit: Tim Kerja Pengelolaan Kinerja Pegawai ASN
   *   - Hanya melihat hasil penilaian sendiri
   *
   * Ahmad Wijaya (pimpinan@demo.go.id)
   *   - Role: assessor, employee, leadership
   *   - Unit: Biro Umum (bisa akses semua tim kerja di Biro Umum)
   *   - Menilai: Dewi Lestari (di Tim Kerja Gaji)
   *
   * Dewi Lestari (dewi@demo.go.id)
   *   - Role: employee
   *   - Unit: Tim Kerja Gaji
   *   - Hanya melihat hasil penilaian sendiri
   *
   * Rudi Hartono (rudi@demo.go.id)
   *   - Role: employee
   *   - Unit: Tim Kerja Budaya Kerja
   *   - Hanya melihat hasil penilaian sendiri
   */
  const demoUsers = [
    {
      id: "user_admin",
      email: "admin@demo.go.id",
      nip: "199001011234567890",
      fullName: "Admin Utama",
      jabatan: "Kepala Biro Organisasi dan SDM",
      unitId: "unit_biro_sdm",
      roles: ["admin", "assessor", "employee", "leadership"] as const,
    },
    {
      id: "user_penilai",
      email: "penilai@demo.go.id",
      nip: "199202021234567891",
      fullName: "Budi Pratama",
      jabatan: "Ketua Tim Kerja Pengelolaan Kinerja Pegawai ASN",
      unitId: "unit_tim_kinerja",
      roles: ["assessor", "employee"] as const,
    },
    {
      id: "user_pegawai",
      email: "pegawai@demo.go.id",
      nip: "199303031234567892",
      fullName: "Siti Rahayu",
      jabatan: "Anggota Tim Kerja Pengelolaan Kinerja",
      unitId: "unit_tim_kinerja",
      roles: ["employee"] as const,
    },
    {
      id: "user_pimpinan",
      email: "pimpinan@demo.go.id",
      nip: "198504041234567893",
      fullName: "Ahmad Wijaya",
      jabatan: "Kepala Biro Umum",
      unitId: "unit_biro_umum",
      roles: ["assessor", "employee", "leadership"] as const,
    },
    {
      id: "user_dewi",
      email: "dewi@demo.go.id",
      nip: "199405051234567894",
      fullName: "Dewi Lestari",
      jabatan: "Anggota Tim Kerja Gaji",
      unitId: "unit_tim_gaji",
      roles: ["employee"] as const,
    },
    {
      id: "user_rudi",
      email: "rudi@demo.go.id",
      nip: "199106061234567895",
      fullName: "Rudi Hartono",
      jabatan: "Anggota Tim Kerja Budaya Kerja",
      unitId: "unit_tim_budaya",
      roles: ["employee"] as const,
    },
  ];

  // Insert setiap pengguna dan perannya
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

    // Insert peran pengguna
    for (const role of u.roles) {
      db.insert(t.userRoles)
        .values({ userId: u.id, role })
        .onConflictDoNothing()
        .run();
    }
  }

  // ==================== 4.1. LEADERS UNIT ====================
  const demoLeaders = [
    { unitId: "unit_biro_sdm", userId: "user_admin", leaderRole: "unit_kerja_leader" },
    { unitId: "unit_biro_umum", userId: "user_pimpinan", leaderRole: "unit_kerja_leader" },
    { unitId: "unit_tim_kinerja", userId: "user_penilai", leaderRole: "tim_kerja_leader" },
  ];

  for (const l of demoLeaders) {
    db.insert(t.unitLeaders).values({ ...l, createdAt: ts, updatedAt: ts }).onConflictDoNothing().run();
  }

  // ==================== 5. PERIODE PENILAIAN ====================

  // Buat periode Q1 2026 (status: active)
  const periodId = "period_q1_2026";
  db.insert(t.assessmentPeriods)
    .values({
      id: periodId,
      name: "Q1 2026",
      quarter: "Q1",
      year: 2026,
      startDate: Date.parse("2026-01-01") / 1000,  // 1 Januari 2026
      endDate: Date.parse("2026-03-31") / 1000,    // 31 Maret 2026
      deadlineDate: Date.parse("2026-04-30") / 1000, // 30 April 2026
      status: "active",
      description: "Periode demo",
      createdAt: ts,
      updatedAt: ts,
    })
    .onConflictDoNothing()
    .run();

  // ==================== 6. PENUGASAN PENILAIAN ====================

  /**
   * Data penugasan penilaian:
   *
   * Admin Utama (Kepala Biro OSDM) menilai:
   * - Budi Pratama (Ketua Tim Kerja Pengelolaan Kinerja)
   *
   * Budi Pratama (Ketua Tim Kerja Pengelolaan Kinerja) menilai:
   * - Siti Rahayu (Anggota Tim Kerja Pengelolaan Kinerja) — di tim yang sama
   *
   * Ahmad Wijaya (Kepala Biro Umum, Leadership) menilai:
   * - Dewi Lestari (Anggota Tim Kerja Gaji) — di bawah Biro Umum
   *
   * Skenario akses:
   * - Admin Utama (leadership): bisa lihat semua tim di Biro OSDM
   * - Ahmad Wijaya (leadership): bisa lihat semua tim di Biro Umum
   * - Budi Pratama (assessor): hanya bisa lihat Siti Rahayu (yang dinilainya)
   * - Siti Rahayu (employee): hanya bisa lihat hasil sendiri
   * - Dewi Lestari (employee): hanya bisa lihat hasil sendiri
   */
  const assigns = [
    // Admin menilai Budi (di Tim Kerja Pengelolaan Kinerja)
    { id: "asg_budi", employeeId: "user_penilai", assessorId: "user_admin", unitId: "unit_tim_kinerja" },
    // Budi menilai Siti (di Tim Kerja Pengelolaan Kinerja)
    { id: "asg_siti", employeeId: "user_pegawai", assessorId: "user_penilai", unitId: "unit_tim_kinerja" },
    // Ahmad menilai Dewi (di Tim Kerja Gaji)
    { id: "asg_dewi", employeeId: "user_dewi", assessorId: "user_pimpinan", unitId: "unit_tim_gaji" },
  ];

  for (const a of assigns) {
    db.insert(t.assessmentAssignments)
      .values({
        ...a,
        periodId,
        status: "pending", // Status awal: menunggu penilaian
        createdAt: ts,
        updatedAt: ts,
      })
      .onConflictDoNothing()
      .run();
  }

  return { seeded: true };
}

// Jalankan seed jika file ini dieksekusi langsung (bukan di-import)
if (import.meta.main) {
  const result = await seed(false);
  console.log(result);
}
