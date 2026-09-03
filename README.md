# Penilaian Perilaku Kerja ASN — Web App Prototype

Sistem penilaian perilaku kerja ASN Kemenkes berdasarkan **7 Nilai Dasar BerAKHLAK**, skor BARS 1–5, dikonversi ke **skala 120**, lalu dipetakan ke **3 Budaya Kerja Kemenkes**.

---

## Fitur Utama

- **4 modul**: Admin, Pejabat Penilai (Assessor), Pegawai, Pimpinan
- **Skor otomatis**: 7 level BARS → skala 120 → 3 Budaya Kerja
- **Form penilaian**: 7 radio BARS + 35 jangkar perilaku + 35 template umpan balik
- **Dashboard pimpinan**: agregat unit, ranking, radar chart, ekspor CSV
- **Keamanan**: JWT, CSRF, rate limiting, RBAC, audit trail
- **81 tes**: unit, integrasi, performa

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Bun 1.4 |
| Backend | Elysia (TypeScript) |
| Database | SQLite + Drizzle ORM (WAL mode) |
| Frontend | React 19 + Vite + Tailwind CSS |
| Routing | React Router v7 |
| Chart | Recharts |
| Linting | Biome |

---

## Struktur Repo

```
prototype-penilaian-perilaku/
├── apps/
│   ├── api/              # Backend Elysia + SQLite
│   │   ├── src/
│   │   │   ├── index.ts      # Semua REST routes
│   │   │   ├── schema.ts     # 14 tabel Drizzle
│   │   │   ├── migrate.ts    # Auto-migration saat start
│   │   │   ├── db.ts         # Koneksi SQLite + WAL
│   │   │   ├── util.ts       # JWT, CSRF, rate limit, CSV parser
│   │   │   └── seed.ts       # Seed data master + user demo
│   │   └── data/app.db       # Database SQLite
│   └── web/              # Frontend React 19
│       └── src/
│           ├── App.tsx            # Router + routes
│           ├── api.ts             # API client
│           ├── auth.tsx           # Auth context
│           ├── components/
│           │   ├── BudayaRadar.tsx # Radar chart 3 sumbu
│           │   ├── PersonSelect.tsx
│           │   └── ui.tsx         # Komponen dasar
│           └── pages/
│               ├── LoginPage.tsx
│               ├── AdminPage.tsx
│               ├── AssessorPage.tsx
│               ├── AssessorFormPage.tsx
│               ├── EmployeePage.tsx
│               ├── EmployeeBerakhlakPage.tsx
│               ├── LeadershipPage.tsx
│               └── ProfilePage.tsx
└── packages/
    └── shared/           # Tipe, rumus skor, konstanta
        └── src/
            ├── constants.ts    # NILAI_DASAR, BARS, BUDAYA_KERJA
            ├── scoring.ts      # calculateScores(), getCategory()
            └── master-text.ts  # PANDUAN, ANCHORS, FEEDBACKS
```

---

## Cara Install & Jalankan

### Prasyarat

- [Bun](https://bun.sh) v1.4 atau lebih baru

### 1. Install dependensi

```bash
bun install
```

### 2. Jalankan migration + seed data

```bash
bun run db:seed
```

Ini akan:
- Membuat tabel SQLite (`apps/api/data/app.db`)
- Seed 7 nilai dasar, 21 panduan, 35 jangkar BARS, 35 template feedback
- Buat 4 user demo dengan password `Password1`

### 3. Jalankan development server

```bash
bun run dev
```

Aplikasi tersedia di:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### 4. Jalankan test

```bash
bun test
```

---

## User Demo

| Email | Password | Role | Unit |
|-------|----------|------|------|
| admin@demo.go.id | Password1 | admin, assessor, employee, leadership | Biro Organisasi dan SDM |
| penilai@demo.go.id | Password1 | assessor, employee | Tim Kerja Pengelolaan Kinerja Pegawai ASN |
| pegawai@demo.go.id | Password1 | employee | Tim Kerja Pengelolaan Kinerja Pegawai ASN |
| pimpinan@demo.go.id | Password1 | assessor, employee, leadership | Biro Umum |
| dewi@demo.go.id | Password1 | employee | Tim Kerja Gaji |
| rudi@demo.go.id | Password1 | employee | Tim Kerja Budaya Kerja |

### Struktur Unit

```
Sekretariat Jenderal (Unit Eselon 1)
├── Biro Organisasi dan SDM (Unit Kerja)
│   ├── Tim Kerja Pengelolaan Kinerja Pegawai ASN
│   ├── Tim Kerja Sistem Informasi ASN
│   └── Tim Kerja Dukungan Manajemen
├── Biro Umum (Unit Kerja)
│   ├── Tim Kerja Gaji
│   ├── Tim Kerja Change Management
│   └── Tim Kerja Dukungan Manajemen dan Rumah Tangga
└── Pusat Pengembangan Kompetensi Aparatur (Unit Kerja)
    ├── Tim Kerja Budaya Kerja
    └── Tim Kerja Dukungan Manajemen
```

---

## Alur Kerja

### Admin

1. Login → Buat periode (Q1–Q4)
2. Import CSV pegawai (NIP, nama, unit, atasan)
3. Override assessor jika perlu
4. Aktifkan periode → Assessor mulai menilai
5. Pantau progres → Kirim reminder → Tutup periode

### Penilai (Assessor)

1. Login → Lihat daftar pegawai binaan
2. Pilih pegawai → Isi 7 level BARS (1–5)
3. Review skor otomatis + edit umpan balik
4. Simpan draft / Submit
5. Revisi jika periode masih aktif

### Pegawai

1. Login → Lihat status periode aktif
2. Buka hasil: skor, kategori, radar 3 sumbu, umpan balik
3. Lihat riwayat penilaian

### Pimpinan

1. Login → Dashboard KPI (jumlah dinilai, % selesai, rata-rata 120)
2. Filter unit/periode → Drill ke ranking unit
3. Lihat daftar pegawai + skor
4. Ekspor CSV

---

## Rumus Skor

```
skor_120(level) = (level / 5) × 120

total_mentah = ND-01-BP + ND-02-AK + ND-03-KP + ND-04-HM + ND-05-LY + ND-06-AD + ND-07-KB
nilai_perilaku_120 = (total_mentah / 35) × 120

Eksekusi Efektif   = avg(ND-02-AK, ND-03-KP, ND-05-LY) / 5 × 120
Cara Kerja Baru    = avg(ND-06-AD, ND-07-KB) / 5 × 120
Pelayanan Unggul   = avg(ND-01-BP, ND-04-HM) / 5 × 120
```

### Kategori Capaian

| Rentang | Label |
|---------|-------|
| 110–120 | Sangat Baik |
| 90–109 | Baik |
| 70–89 | Butuh Perbaikan |
| 50–69 | Kurang |
| 0–49 | Sangat Kurang |

---

## API Endpoints

### Auth

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/change-password
GET  /api/me
```

### Admin

```
GET|POST   /api/admin/periods
GET|PATCH  /api/admin/periods/:id
DELETE     /api/admin/periods/:id
POST       /api/admin/periods/:id/activate
POST       /api/admin/periods/:id/close
POST       /api/admin/periods/:id/import
GET|POST   /api/admin/users
GET|PATCH  /api/admin/users/:id
POST       /api/admin/users/:id/reset-password
GET|POST   /api/admin/units
GET|PATCH  /api/admin/master/nilai-dasar/:id
GET|PATCH  /api/admin/master/bars-anchors/:id
GET        /api/admin/reports/aggregated
```

### Penilai

```
GET  /api/assessor/dashboard
GET  /api/assessor/employees
GET  /api/assessor/assignments/:id/form
POST /api/assessor/assessments
PATCH /api/assessor/assessments/:id
GET  /api/assessor/assessments/:id
```

### Pegawai

```
GET /api/employee/dashboard
GET /api/employee/assessments/current
GET /api/employee/assessments/history
GET /api/employee/assessments/:id
```

### Pimpinan

```
GET /api/leadership/dashboard
GET /api/leadership/reports/by-unit
GET /api/leadership/reports/ranking
GET /api/leadership/units/:unitId/employees
```

---

## Kontribusi

Projek ini adalah prototype. Lihat `docs/PRD-Final.md` untuk spesifikasi lengkap.

### Kontak

Untuk koordinasi atau diskusi:
- **Jaki** — 081315866766

### Menjalankan test

```bash
# Semua test
bun test

# Test tertentu
bun test packages/shared/src/scoring.test.ts
bun test apps/api/src/util.test.ts
```

### Linting

```bash
npx @biomejs/biome check apps/web/src/
```

---

## Lisensi

Internal — Kementerian Kesehatan RI
