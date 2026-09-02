# PRD Final — Web App Penilaian Perilaku Kerja ASN Kemenkes

**Versi**: 2.1-final  
**Tanggal**: 2 September 2026  
**Status**: Siap di-build (sumber kebenaran tunggal)  
**Sumber**: `1 PRD-v2-0.md`, `2 PRD-AMENDMENT-FEEDBACK-FEATURE.md`, `3 PRD-AMENDMENT-MASTER-DATA-RADAR.md`, Excel `docs/2026.09.01 V2 Konsep Panduan Penilaian Perilaku BerAKHLAK (1).xlsx`, keputusan produk 2 Sep 2026  
**Tujuan dokumen**: spesifikasi implementasi untuk vibecoding di Cursor. Jangan menambah fitur di luar dokumen ini.

---

## 0. Cara memakai dokumen ini

1. Implementasi mengikuti urutan **Bagian 14 (urutan build)**.
2. Rumus skor hanya boleh diambil dari **Bagian 5**. Contoh angka di mockup lama yang bertentangan dianggap salah.
3. UI dalam **Bahasa Indonesia**. Kode, nama tabel, endpoint, dan identifier dalam **English snake/kebab-case**, kecuali istilah domain resmi (`nilai_dasar`, `panduan_perilaku`, `budaya_kerja`).
4. Jika ada konflik antara dokumen PRD lama dan dokumen ini, **dokumen ini yang menang**.
5. Jangan mengimplementasikan item yang tertulis **V3+ / Out of scope**.

---

## 1. Keputusan yang dikunci (hasil review)

Keputusan ini menambal kontradiksi antar PRD. Alasan ada di Bagian 16.

| # | Topik | Keputusan V2 |
|---|--------|----------------|
| D1 | Jumlah modul | **4 modul**: Admin, Pejabat Penilai, Pegawai, Pimpinan. Ringkasan “3 modul” di PRD lama diabaikan. |
| D2 | Multi-role | Satu user bisa punya **banyak role**. Atasan = pegawai + assessor. Role tidak disimpan sebagai satu kolom `role`. |
| D3 | Rumus skor | Rumus kanonik di Bagian 5 (Sheet2: total 24 → 82.29). Angka 75.43 di Sheet3 adalah contoh level berbeda, bukan rumus lain. |
| D4 | Kategori capaian | Sangat Baik 110–120 · Baik 90–109 · Butuh Perbaikan 70–89 · Kurang 50–69 · Sangat Kurang 0–49. |
| D5 | Feedback form | Satu textarea per nilai dasar (auto-isi template, bisa diedit) + toggle tampilkan ke pegawai + 1 catatan tambahan. Tanpa 3 checkbox yang saling bertentangan. |
| D6 | Master data | Admin **mengedit teks** 7 nilai, 21 panduan, 5 label BARS, 35 jangkar BARS, 35 template feedback. **Tidak boleh** tambah/hapus nilai dasar atau level (akan merusak rumus). |
| D7 | Periode aktif | Hanya **satu periode `active`** di seluruh organisasi. |
| D8 | Draft penilaian | Ada status `draft`. Pegawai hanya melihat status `submitted` / `revised`. |
| D9 | PDF pegawai | Pegawai **tidak** dapat unduh PDF resmi. Assessor, admin, pimpinan bisa. Print browser tidak dicegah. |
| D10 | Stack | TypeScript, **Bun 1.4**, Elysia, Drizzle ORM, SQLite, React 19, Tailwind CSS. Frontend: Vite + TanStack Router/Query. UI: Tailwind (+ shadcn/ui opsional). Chart: Recharts. Bukan Prisma, bukan Solid.js, bukan Next.js. |
| D11 | Email | **Tidak ada SMTP.** Notifikasi in-app saja. |
| D12 | Drill-down pimpinan | Pimpinan melihat agregat + daftar skor pegawai di unitnya (dan anak unit). Radar per pegawai berdampingan **tidak** masuk V2. Modul pimpinan dibangun **setelah penilaian jalan** (Fase D). |
| D13 | Self-assess | Assessor **tidak boleh** menilai dirinya sendiri. |
| D14 | Compliance | UU PDP 27/2022, bukan GDPR. |
| D15 | Insight tren | Rule-based sederhana, bukan ML. |
| D16 | Pimpinan puncak | Prototype: tetap **di-assign admin**. Tidak ada auto-skip. |
| D17 | Buka periode | Admin boleh `closed → active` (tercatat audit). |

---

## 2. Ringkasan produk

Sistem penilaian perilaku kerja ASN Kemenkes berdasarkan **7 Nilai Dasar BerAKHLAK**, skor BARS 1–5, dikonversi ke **skala 120**, lalu dipetakan ke **3 Budaya Kerja Kemenkes**.

**Masalah**: penilaian masih manual/Excel, tidak ada sumber data tunggal, umpan balik tidak terstruktur, laporan agregat lambat.

**Tujuan V2**:
- Satu platform penilaian per periode triwulan
- Skor terstandar + kalkulasi otomatis
- Alur role-based (admin → penilai → pegawai → pimpinan)
- Laporan agregat untuk pimpinan
- Jejak audit (siapa menilai siapa, kapan, skor berapa, apa yang diubah)

**Kepatuhan**: PermenPANRB 6/2022, UU 20/2023, kebijakan internal Kemenkes, UU PDP 27/2022.

---

## 3. Scope

### 3.1 Masuk V2

- Autentikasi email + password (JWT httpOnly cookie)
- CRUD user, unit hierarkis, import CSV pegawai
- Manajemen periode Q1–Q4 + assignment assessor
- Form penilaian 7 nilai dasar + BARS + feedback template
- Draft, submit, revisi (selama periode `active`)
- Tampilan hasil pegawai (read-only) + riwayat + radar 3 sumbu
- Dashboard admin: progres, reminder, audit log
- Dashboard pimpinan: agregat unit / nilai / budaya, ranking, ekspor PDF/CSV
- Master data: edit teks (bukan ubah struktur 7×5)
- Notifikasi in-app saja (tanpa email)
- Seed data master dari Excel + 1 set user demo

### 3.2 Keluar dari V2 (jangan dibangun)

- 360-degree review / multi-assessor per pegawai per periode
- SSO / LDAP / OTP
- Integrasi HRIS real-time
- Aplikasi mobile native
- Analytics/ML
- Jadwal kirim laporan otomatis
- CRUD struktur nilai dasar (tambah nilai ke-8, hapus nilai)
- Multi-bahasa
- Cegah screenshot
- Radar per pegawai side-by-side
- Versioning template feedback
- SMTP / email / Nodemailer
- Skala predikat KemenPANRB 40–100 (7 poin) di kolom F Excel — **bukan** rumus V2
- PostgreSQL (rencana V3)

---

## 4. Role, akses, dan journey

### 4.1 Role (additive)

| Role | Siapa | Akses utama |
|------|--------|-------------|
| `employee` | Semua user aktif | Lihat hasil sendiri |
| `assessor` | Atasan yang punya assignment | Nilai pegawai binaan |
| `admin` | Tim Pengelolaan Kinerja | Setup, import, master data, semua laporan, audit |
| `leadership` | Eselon I / pimpinan unit | Agregat unit sendiri + anak unit, ekspor |

Satu user bisa: `employee` + `assessor` + `leadership`. Admin juga `employee` (bisa punya penilaian sendiri jika di-assign).

Navigasi menampilkan modul sesuai role yang dimiliki. Default landing:
- admin → `/admin`
- leadership (tanpa admin) → `/pimpinan`
- assessor → `/penilai`
- employee only → `/pegawai`

### 4.2 Matriks akses

| Fitur | Admin | Assessor | Employee | Leadership |
|-------|:-----:|:--------:|:--------:|:----------:|
| Setup periode | Ya | Tidak | Tidak | Tidak |
| Assign assessor | Ya | Tidak | Tidak | Tidak |
| Isi penilaian | Tidak* | Ya (assignment-nya) | Tidak | Tidak |
| Lihat hasil sendiri | Ya | Ya | Ya | Ya |
| Lihat hasil orang lain | Semua | Pegawai binaannya | Tidak | Daftar skor di unitnya |
| Laporan agregat | Semua unit | Statistik binaannya saja | Tidak | Unit + anak unit |
| Ekspor PDF/CSV | Ya | PDF penilaian sendiri | Tidak | Ya (agregat + unit) |
| Edit master data | Ya | Tidak | Tidak | Tidak |
| Kelola user | Ya | Tidak | Tidak | Tidak |

\*Admin tidak mengisi penilaian lewat peran admin. Jika admin juga assessor, ia memakai modul penilai.

### 4.3 Journey singkat

**Admin**: login → buat periode → import CSV → cek/override assign → aktifkan periode → pantau progres → kirim reminder → tutup periode → unduh laporan.

**Penilai**: login → daftar binaan → pilih pegawai → pilih 7 level BARS → review skor otomatis → sesuaikan feedback → simpan draft / submit → unduh PDF → revisi jika periode masih aktif.

**Pegawai**: login → status periode → buka hasil (skor, radar, umpan balik) → lihat riwayat.

**Pimpinan**: login → KPI periode berjalan → filter unit/periode → drill ke unit → ranking → ekspor.

---

## 5. Scoring — sumber kebenaran

Semua angka di UI, PDF, API, dan seed tes harus memakai rumus ini. Hitung di **backend** saat submit/revisi; frontend hanya menampilkan preview dengan rumus yang sama.

### 5.1 Input

Tujuh integer wajib, masing-masing `1 | 2 | 3 | 4 | 5`:

| Kode | Nilai Dasar | Budaya Kerja |
|------|-------------|--------------|
| `BP` | Berorientasi Pelayanan | Pelayanan Unggul |
| `AK` | Akuntabel | Eksekusi Efektif |
| `KP` | Kompeten | Eksekusi Efektif |
| `HM` | Harmonis | Pelayanan Unggul |
| `LY` | Loyal | Eksekusi Efektif |
| `AD` | Adaptif | Cara Kerja Baru |
| `KB` | Kolaboratif | Cara Kerja Baru |

Pemetaan ini **tetap**. Tidak bisa diubah admin di V2.

### 5.2 Rumus

```
skor_nilai_120(level) = (level / 5) * 120          // = level * 24

total_mentah          = BP+AK+KP+HM+LY+AD+KB       // 7..35
nilai_perilaku_120    = (total_mentah / 35) * 120

eksekusi_efektif      = avg(AK, KP, LY) / 5 * 120
cara_kerja_baru       = avg(AD, KB) / 5 * 120
pelayanan_unggul      = avg(BP, HM) / 5 * 120
```

Pembulatan: **2 desimal**, half-up (`Math.round(x * 100) / 100`).

### 5.3 Kategori capaian (skor 0–120)

Ditetapkan produk 2 Sep 2026. Pakai untuk nilai perilaku 120 **dan** ketiga skor budaya kerja.

| Rentang (inklusif) | Label |
|--------------------|--------|
| 110 – 120 | Sangat Baik |
| 90 – 109 | Baik |
| 70 – 89 | Butuh Perbaikan |
| 50 – 69 | Kurang |
| 0 – 49 | Sangat Kurang |

Batas desimal: `>=110` Sangat Baik, `>=90` Baik, `>=70` Butuh Perbaikan, `>=50` Kurang, selain itu Sangat Kurang. Skor 109.99 = Baik; 110 = Sangat Baik.

```
function getCategory(score: number): string {
  if (score >= 110) return "Sangat Baik";
  if (score >= 90) return "Baik";
  if (score >= 70) return "Butuh Perbaikan";
  if (score >= 50) return "Kurang";
  return "Sangat Kurang";
}
```

Jangan memakai predikat 40/50/60/…/100 di kolom F Excel (itu konsep KemenPANRB lain).

### 5.4 Contoh kanonik (wajib di tes)

Sumber rumus: Excel Sheet2. Input: BP=1, AK=2, KP=5, HM=4, LY=3, AD=4, KB=5

| Output | Nilai |
|--------|-------|
| Total mentah | 24 / 35 |
| Nilai perilaku 120 | 82.29 → **Butuh Perbaikan** |
| BP / AK / KP / HM / LY / AD / KB (skala 120) | 24 / 48 / 120 / 96 / 72 / 96 / 120 |
| Eksekusi Efektif `avg(2,5,3)/5*120` | 80.00 → Butuh Perbaikan |
| Cara Kerja Baru `avg(4,5)/5*120` | 108.00 → Baik |
| Pelayanan Unggul `avg(1,4)/5*120` | 60.00 → Kurang |

Catatan: angka **75.43** di Excel Sheet3 berasal dari **set level berbeda** (BP1 AK2 KP3 HM3 LY4 AD5 KB4 = total 22), bukan dari Sheet2. Jangan dicampur.

### 5.5 Label BARS (generik)

| Level | Nama |
|-------|------|
| 1 | Kontraproduktif |
| 2 | Reaktif Minim Inisiatif |
| 3 | Sesuai Standar |
| 4 | Proaktif Tanpa Diminta |
| 5 | Role Model |

Teks **jangkar perilaku** (kalimat di radio button) spesifik per nilai dasar × level (35 baris). Teks **umpan balik** juga 35 baris, terpisah dari jangkar.

---

## 6. Aturan bisnis

### 6.1 Periode

Field: `name`, `quarter` (Q1–Q4), `year`, `startDate`, `endDate`, `deadlineDate`, `status` (`draft` \| `active` \| `closed` \| `archived`), `description?`.

Validasi:
- `(year, quarter)` unik
- `startDate < endDate`
- `deadlineDate >= endDate` (jendela penilaian setelah masa kerja)
- Rentang `[startDate, endDate]` tidak boleh overlap dengan periode lain (deadline boleh di luar rentang kerja)
- Hanya satu status `active` pada satu waktu
- Hapus hanya jika `draft` dan belum ada assignment
- `active` → assessor boleh draft/submit/revisi
- `closed` / `archived` → penilaian terkunci; data tetap bisa dibaca
- Transisi: `draft → active → closed → archived`. Tidak boleh mundur kecuali admin membuka kembali `closed → active` (dicatat di audit)

### 6.2 Assignment

- Satu pegawai = satu assessor per periode (`UNIQUE(periodId, employeeId)`)
- Import CSV membuat/memperbarui user + unit + assignment
- Jika `NIP_Atasan` belum ada: buat user assessor placeholder (`isActive=true`, password sementara)
- Override assessor manual harus user terdaftar dan aktif
- `assessorId !== employeeId`
- Pegawai tanpa atasan di CSV: assignment kosong, status `unassigned`, admin wajib isi sebelum periode diaktifkan
- Periode hanya bisa `active` jika semua pegawai di periode itu sudah punya assessor
- Ganti assessor di tengah jalan: assignment pindah; draft/submit lama tetap milik assessment record (assessorId di assessment ikut ter-update ke assessor baru hanya untuk revisi berikutnya). Assessor lama kehilangan akses edit. Audit mencatat reassignment.

### 6.3 Penilaian

- Satu assessment per assignment
- Submit mensyaratkan 7 level terisi
- Feedback per nilai opsional (boleh dikosongkan / disembunyikan dari pegawai)
- Catatan tambahan opsional, max 500 karakter
- Feedback teredit max 300 karakter, plain text
- Ganti level di form: textarea diisi ulang dari template level baru; jika teks sebelumnya sudah diedit, tampilkan konfirmasi
- `draft`: pegawai tidak melihat hasil
- `submitted` lalu diedit: status menjadi `revised`; record utama di-overwrite; versi lama hanya di `assessment_history`
- Setelah submit/revisi: hitung ulang skor di server; buat/upsert 7 baris `assessment_feedbacks`; notifikasi in-app ke pegawai

### 6.4 Import pegawai

CSV kolom wajib (header persis):

```
NIP,Nama,PangkatGolongan,UnitKode,UnitNama,Jabatan,Email,NIP_Atasan
```

- NIP unik, 18 digit angka
- Email unik, format valid
- Unit: jika `UnitKode` belum ada, buat unit baru
- NIP sudah ada: update profil, jangan duplikat
- Email bentrok dengan NIP lain: baris gagal, tampilkan error per baris
- V2: CSV dulu. Excel `.xlsx` boleh jika library sudah ada; jangan buat parser custom.

### 6.5 Password

- Admin membuat user / import: generate password acak 12 karakter, tampilkan sekali di hasil import
- Login pertama: wajib ganti password
- Reset password: admin generate baru
- Hash: bcrypt (cost 10+)
- Kebijakan V2: min 8 karakter, 1 huruf, 1 angka. Tidak ada expiry.

### 6.6 Notifikasi

Hanya in-app. **Jangan** bangun SMTP, Nodemailer, atau pengaturan email.

| Event | Penerima | Channel |
|-------|----------|---------|
| Periode diaktifkan | Semua assessor periode itu | In-app |
| H-14 dan H-7 deadline | Assessor yang masih ada pending | In-app |
| Assessment submitted/revised | Pegawai | In-app |
| Periode ditutup | Admin + leadership | In-app |
| Overdue | Admin dashboard badge | In-app |

Reminder H-14/H-7: job sederhana (interval 1 jam) atau trigger saat admin buka dashboard. Deduplikasi per user per periode per jenis. Admin juga bisa kirim reminder massal (`POST .../notify`) yang menulis notifikasi in-app.

---

## 7. Model data

SQLite + Drizzle. ID: `text` (ulid/cuid). Timestamp: unix epoch integer. Soft-delete user dan unit lewat `isActive`.

### 7.1 Identitas & organisasi

```
users
  id, email unique, username unique?, passwordHash, fullName
  nip unique?, pangkatGolongan?, jabatan?
  unitId → units.id
  isActive, mustChangePassword, lastLogin
  createdAt, updatedAt

user_roles
  userId → users.id
  role  'admin' | 'assessor' | 'employee' | 'leadership'
  PRIMARY(userId, role)

units
  id, code unique, name
  level  'eselon' | 'bagian' | 'seksi' | 'upt' | 'lainnya'
  parentUnitId → units.id
  isActive, createdAt, updatedAt
```

Setiap user aktif otomatis punya role `employee`. Role `assessor` ditambahkan saat user pertama kali menjadi assessor di assignment (atau di-set admin).

### 7.2 Master data (seed, edit teks saja)

```
nilai_dasar
  id, code unique (BP|AK|KP|HM|LY|AD|KB), name, description, sortOrder
  updatedAt, updatedBy → users.id

panduan_perilaku
  id, nilaiDasarId → nilai_dasar.id, sequence (1-3)
  title, description
  UNIQUE(nilaiDasarId, sequence)

bars_levels
  level PK (1-5), name, description

bars_anchors          -- teks radio button
  id, nilaiDasarId, level (1-5), anchorText
  UNIQUE(nilaiDasarId, level)

feedback_templates
  id, nilaiDasarId, level (1-5), templateText  -- max 300
  UNIQUE(nilaiDasarId, level)

budaya_kerja          -- 3 baris tetap
  id, code (EE|CK|PU), name
  -- EE=Eksekusi Efektif, CK=Cara Kerja Baru, PU=Pelayanan Unggul
```

Mapping nilai → budaya **hardcoded di kode** (Bagian 5.1), bukan tabel yang bisa diedit.

### 7.3 Periode & penilaian

```
assessment_periods
  id, name, quarter, year, startDate, endDate, deadlineDate
  status, description, createdAt, updatedAt
  UNIQUE(year, quarter)

assessment_assignments
  id, periodId, employeeId, assessorId, unitId
  status  'unassigned' | 'pending' | 'draft' | 'submitted' | 'revised'
  createdAt, updatedAt
  UNIQUE(periodId, employeeId)

assessments
  id, assignmentId unique, periodId, employeeId, assessorId
  nilaiBp, nilaiAk, nilaiKp, nilaiHm, nilaiLy, nilaiAd, nilaiKb   -- 1-5
  totalScore, scoreScale120
  budayaEksekusiEfektif, budayaCaraKerjaBaru, budayaPelayananUnggul
  additionalFeedback?   -- max 500
  status  'draft' | 'submitted' | 'revised'
  submittedAt?, revisedAt?
  createdAt, updatedAt

assessment_feedbacks
  id, assessmentId, nilaiDasarId, level
  templateText, finalText, isEdited, includeForEmployee
  UNIQUE(assessmentId, nilaiDasarId)

assessment_history
  id, assessmentId, action  -- created|updated|submitted|revised|reassigned
  changedBy, changeDetails (JSON text), ipAddress?, createdAt

notifications
  id, userId, type, periodId?, subject, body, isRead, createdAt

master_data_audit
  id, tableName, recordId, action, changedFields (JSON), changedBy, changedAt

system_settings  -- single row
  organizationName, logoUrl?
  primaryColor default '#185FA5'
```

Index: `(periodId, employeeId)`, `(periodId, assessorId)`, `(assessorId, status)`, `(employeeId)`, `(unitId)`, `(periodId, status)`.

---

## 8. API

Prefix `/api`. Auth: cookie JWT, 24 jam, refresh `/api/auth/refresh`. Semua mutasi butuh CSRF double-submit atau SameSite=Lax + origin check. Validasi body dengan schema Elysia. Error: `{ error: { code, message } }`.

### 8.1 Auth

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/change-password      # wajib jika mustChangePassword
GET  /api/me                        # profil + roles + unit
```

Tidak ada register publik. User hanya dibuat admin.

### 8.2 Admin

```
GET|POST          /api/admin/periods
GET|PATCH         /api/admin/periods/:id
DELETE            /api/admin/periods/:id          # draft only
POST              /api/admin/periods/:id/activate
POST              /api/admin/periods/:id/close
POST              /api/admin/periods/:id/reopen
GET               /api/admin/periods/:id/progress

GET|POST          /api/admin/periods/:id/assignments
POST              /api/admin/periods/:id/import   # multipart CSV
PATCH             /api/admin/assignments/:id
POST              /api/admin/periods/:id/notify

GET|POST          /api/admin/users
GET|PATCH         /api/admin/users/:id
POST              /api/admin/users/:id/reset-password
POST              /api/admin/users/:id/roles

GET|POST          /api/admin/units
PATCH|DELETE      /api/admin/units/:id

GET|PATCH         /api/admin/master/nilai-dasar/:id
GET|PATCH         /api/admin/master/panduan/:id
GET|PATCH         /api/admin/master/bars-levels/:id
GET|PATCH         /api/admin/master/bars-anchors/:id
GET|PATCH         /api/admin/master/feedback-templates/:id
GET               /api/admin/master/audit

GET               /api/admin/reports/aggregated
GET               /api/admin/reports/audit
GET               /api/admin/reports/export?format=pdf|csv&type=...

GET|PATCH         /api/admin/settings
```

Tidak ada `POST` master data untuk entity baru (D6).

### 8.3 Penilai

```
GET  /api/assessor/dashboard
GET  /api/assessor/employees?periodId=&status=&q=
GET  /api/assessor/assignments/:id/form          # pegawai + anchors + templates
POST /api/assessor/assessments                   # draft | submit
PATCH /api/assessor/assessments/:id
GET  /api/assessor/assessments/:id
GET  /api/assessor/assessments/:id/pdf
GET  /api/assessor/statistics?periodId=
```

Body submit:

```json
{
  "assignmentId": "…",
  "action": "draft" | "submit",
  "scores": { "BP": 1, "AK": 2, "KP": 5, "HM": 4, "LY": 3, "AD": 4, "KB": 5 },
  "feedbacks": [
    {
      "nilaiDasarCode": "BP",
      "finalText": "…",
      "includeForEmployee": true
    }
  ],
  "additionalFeedback": "…"
}
```

Server mengisi `templateText`, `isEdited`, dan semua skor kalkulasi. Jangan percaya angka skor dari client.

### 8.4 Pegawai

```
GET /api/employee/dashboard
GET /api/employee/assessments/current
GET /api/employee/assessments/history
GET /api/employee/assessments/:id
GET /api/employee/help
```

Response hasil hanya memuat feedback `includeForEmployee=true`. Field `wasCustomized` boleh dikirim; tampilkan indikator kecil.

### 8.5 Pimpinan

```
GET /api/leadership/dashboard?periodId=
GET /api/leadership/reports/by-unit?periodId=&unitId=
GET /api/leadership/reports/by-value?periodId=&nilaiDasar=
GET /api/leadership/reports/by-culture?periodId=
GET /api/leadership/reports/ranking?periodId=
GET /api/leadership/units/:unitId/employees?periodId=
GET /api/leadership/reports/export?format=pdf|csv&type=...
```

Scope otomatis: unit user + keturunan. Admin yang memanggil endpoint admin tidak dibatasi unit.

---

## 9. Modul UI

Desain: shadcn/ui, Tailwind, warna primer `#185FA5`, font min 14px, layout responsif. Jangan buat design system baru.

### 9.1 Publik

- `/login` — email, password, error jelas, rate limit
- `/ganti-password` — jika `mustChangePassword`

### 9.2 Admin

| Route | Isi |
|-------|-----|
| `/admin` | KPI: jumlah periode, % selesai periode aktif, overdue, last import |
| `/admin/periode` | Tabel periode, filter tahun/status |
| `/admin/periode/baru` | Form create |
| `/admin/periode/:id` | Detail, progres, daftar assessor, reminder, tutup/arsip |
| `/admin/periode/:id/import` | Upload CSV + laporan sukses/gagal per baris |
| `/admin/periode/:id/assignment` | Override assessor |
| `/admin/pengguna` | CRUD, role, reset password, enable/disable |
| `/admin/unit` | Tree unit |
| `/admin/master` | Tab: Nilai Dasar, Panduan, BARS, Jangkar, Feedback |
| `/admin/laporan` | Agregat + ekspor |
| `/admin/audit` | Filter periode/user/tanggal |
| `/admin/pengaturan` | Nama org, logo, warna primer |

Master data form: edit teks + preview. Tombol hapus **tidak ada**.

### 9.3 Penilai

| Route | Isi |
|-------|-----|
| `/penilai` | Jumlah binaan, % selesai, sisa hari deadline |
| `/penilai/pegawai` | Tabel NIP, nama, jabatan, status, tanggal, skor 120, aksi |
| `/penilai/nilai/:assignmentId` | Wizard penilaian |
| `/penilai/riwayat` | Submission + view/PDF/edit |
| `/penilai/statistik` | Distribusi level binaan |

**Wizard penilaian (satu halaman scroll atau 3 step):**

1. Header pegawai + instruksi
2. Tujuh blok nilai dasar. Tiap blok: nama, 3 panduan (collapsible), 5 radio BARS (nama level + `anchorText`). Preview “Saat ini: Level X”
3. Ringkasan skor (tabel + 3 budaya + kategori) — live
4. Tujuh textarea umpan balik (terisi template, counter 300, toggle “Tampilkan ke pegawai”). Satu catatan tambahan 500
5. Aksi: Kembali, Simpan Draft, Submit (checkbox konfirmasi jujur/adil)

Jangan pakai checkbox “gunakan default” + “edit” + “skip” sekaligus.

### 9.4 Pegawai

| Route | Isi |
|-------|-----|
| `/pegawai` | Kartu status periode aktif |
| `/pegawai/hasil/:id` | Tabel 7 nilai, total, 3 budaya, radar, umpan balik |
| `/pegawai/riwayat` | Tabel + line chart 3 budaya vs periode |
| `/pegawai/bantuan` | FAQ, glosarium (konten statis) |

Hasil: read-only. Tanpa tombol unduh. Indikator kecil jika feedback dikustomisasi. Insight tren rule-based:
- Kuat: nilai dengan rata-rata level ≥ 4 pada 2 periode terakhir
- Pengembangan: level ≤ 2 atau turun ≥ 1 level vs periode sebelumnya
- Jika data < 2 periode: jangan tampilkan insight

### 9.5 Pimpinan

| Route | Isi |
|-------|-----|
| `/pimpinan` | 3 KPI (jumlah dinilai, % selesai, rata-rata 120), bar 3 budaya, top unit, overdue |
| `/pimpinan/unit` | Agregat per unit + radar rata-rata + distribusi level |
| `/pimpinan/nilai` | 7 tab nilai dasar: rata-rata, distribusi, top/bottom unit |
| `/pimpinan/budaya` | 3 tab budaya + tren max 4 periode |
| `/pimpinan/ranking` | Leaderboard unit |
| `/pimpinan/unit/:id` | Daftar pegawai + skor (bukan radar grid) |

Distribusi level di laporan unit: kelompokkan pegawai berdasarkan `round(totalScore / 7)` ke 1–5.

Filter periode selalu ada. Ekspor: ringkasan eksekutif, full, ranking, budaya.

### 9.6 Radar chart

Recharts `RadarChart`, 3 sumbu, domain 0–120, warna `#185FA5`. Lokasi: hasil pegawai, dashboard pimpinan (1 chart agregat), laporan unit (1 chart). Tampilkan tabel skor + kategori di bawah chart.

---

## 10. Seed master data

Sumber: Excel Sheet1 `docs/2026.09.01 V2 Konsep Panduan Penilaian Perilaku BerAKHLAK (1).xlsx`. Seed **harus** memakai teks di bawah (kecuali catatan typo). Jangan mengarang narasi tambahan.

Typo Excel yang dinormalisasi:
- `Melakukan perbaikan tiada hent` → **henti**
- `UUD Negara RI Tahun I945` → **1945**
- Definisi Harmonis/Kolaboratif yang terpecah baris digabung jadi satu kalimat.

**Celan Excel:** umpan balik Akuntabel level 5 **kosong**. Seed string kosong; admin mengisi lewat master data. Form tetap valid.

### 10.1 Nilai dasar (definisi operasional Excel kolom C)

| id | code | name | description |
|----|------|------|-------------|
| nilai_bp | BP | Berorientasi Pelayanan | Komitmen memberikan pelayanan prima demi kepuasan masyarakat |
| nilai_ak | AK | Akuntabel | Bertanggung jawab atas kepercayaan yang diberikan |
| nilai_kp | KP | Kompeten | Terus belajar dan mengembangkan kapabilitas |
| nilai_hm | HM | Harmonis | Saling peduli dan menghargai perbedaan |
| nilai_ly | LY | Loyal | Berdedikasi dan mengutamakan kepentingan bangsa dan negara |
| nilai_ad | AD | Adaptif | Terus berinovasi dan antusias dalam menggerakkan serta menghadapi perubahan |
| nilai_kb | KB | Kolaboratif | Membangun kerja sama yang sinergis |

### 10.2 Panduan perilaku (judul Excel kolom E)

1. **BP**: Memahami dan memenuhi kebutuhan masyarakat · Ramah, cekatan, solutif, dan dapat diandalkan · Melakukan perbaikan tiada henti
2. **AK**: Melaksanakan tugas dengan jujur, bertanggung jawab, cermat, disiplin, dan berintegritas tinggi · Menggunakan kekayaan dan BMN secara bertanggung jawab, efektif, dan efisien · Tidak menyalahgunakan kewenangan jabatan
3. **KP**: Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah · Membantu orang lain belajar · Melaksanakan tugas dengan kualitas terbaik
4. **HM**: Menghargai setiap orang tanpa membedakan latar belakang · Suka menolong · Membangun lingkungan kerja yang kondusif
5. **LY**: Memegang teguh ideologi Pancasila, UUD Negara RI Tahun 1945, setia kepada NKRI, dan pemerintahan yang sah · Menjaga nama baik ASN, instansi, dan negara · Menjaga rahasia jabatan dan negara
6. **AD**: Cepat menyesuaikan diri menghadapi perubahan · Terus berinovasi dan mengembangkan kreativitas · Bertindak proaktif
7. **KB**: Memberi kesempatan kepada berbagai pihak untuk berkontribusi · Terbuka dalam bekerja sama untuk menghasilkan nilai tambah · Menggerakkan pemanfaatan berbagai sumber daya untuk tujuan bersama

Field `description` panduan boleh sama dengan `title` di V2 (Excel tidak punya uraian terpisah yang wajib).

### 10.3 Jangkar BARS (Excel kolom I–M) — teks radio

**BP**
1. Membiarkan keluhan masyarakat/pengguna layanan tidak ditindaklanjuti hingga berlarut-larut.
2. Melayani sesuai jam kerja formal tanpa berusaha memahami kebutuhan sebenarnya dari masyarakat yang dilayani.
3. Menyelesaikan permintaan layanan sesuai standar prosedur yang berlaku, namun baru bertindak setelah diminta.
4. Menindaklanjuti keluhan atau kebutuhan masyarakat dengan cepat dan memberikan solusi yang tepat tanpa diminta berulang kali.
5. Mengusulkan dan menerapkan perbaikan layanan atas inisiatif sendiri berdasarkan masukan masyarakat, sebelum diminta oleh atasan.

**AK**
1. Menggunakan fasilitas/aset kantor untuk kepentingan pribadi di luar peruntukannya.
2. Menyelesaikan tugas dengan hasil yang tidak sesuai standar karena kurang teliti dalam bekerja.
3. Menyelesaikan tugas sesuai batas waktu dan aturan yang ditetapkan tanpa perlu diawasi ketat.
4. Melaporkan penggunaan anggaran/aset secara transparan dan tepat waktu sesuai ketentuan yang berlaku.
5. Mengingatkan atau menegur rekan kerja yang menyalahgunakan wewenang/aset, meski berisiko tidak populer.

**KP**
1. Menolak mengikuti pelatihan atau kegiatan pengembangan kompetensi yang ditugaskan.
2. Mengerjakan tugas dengan cara lama meski sudah tidak sesuai kebutuhan pekerjaan saat ini.
3. Mengikuti pelatihan/tugas belajar yang diwajibkan dan menerapkannya pada pekerjaan sehari-hari.
4. Mempelajari keterampilan baru secara mandiri untuk menyelesaikan tugas yang belum pernah dikerjakan sebelumnya.
5. Membimbing/melatih rekan kerja lain hingga rekan tersebut mampu menyelesaikan tugas secara mandiri.

**HM**
1. Membeda-bedakan perlakuan kepada rekan kerja berdasarkan suku, agama, atau golongan tertentu.
2. Membiarkan rekan kerja kesulitan menyelesaikan tugas tanpa menawarkan bantuan.
3. Bersedia membantu rekan kerja yang meminta bantuan secara langsung.
4. Menawarkan bantuan kepada rekan kerja yang kesulitan tanpa diminta terlebih dahulu.
5. Menjadi penengah saat terjadi perselisihan antar rekan kerja hingga situasi kembali kondusif.

**LY**
1. Menyebarkan informasi rahasia instansi kepada pihak yang tidak berwenang.
2. Menyampaikan keluhan tentang kebijakan instansi di media sosial atau ruang publik.
3. Menjalankan kebijakan dan arahan pimpinan yang sah sesuai aturan yang berlaku.
4. Menjaga kerahasiaan data/dokumen negara sesuai dengan tingkat kerahasiaannya.
5. Membela nama baik instansi secara aktif ketika instansi mendapat kritik yang tidak berdasar di ruang publik.

**AD**
1. Menolak menjalankan cara kerja atau sistem baru yang ditetapkan instansi.
2. Menjalankan sistem/cara kerja baru hanya setelah diperintahkan berulang kali oleh atasan.
3. Menyesuaikan diri dengan perubahan kebijakan atau sistem kerja dalam waktu yang wajar.
4. Mengusulkan cara atau ide baru untuk menyelesaikan pekerjaan lebih efektif dari sebelumnya.
5. Menjadi pihak pertama yang mencoba dan menerapkan sistem/teknologi baru sebelum diwajibkan, lalu membagikannya ke rekan kerja.

**KB**
1. Menolak bekerja sama dengan unit atau pihak lain meski dibutuhkan untuk penyelesaian tugas.
2. Bekerja sama dengan pihak lain hanya jika ditugaskan secara langsung oleh atasan.
3. Berkontribusi aktif dalam tim lintas unit sesuai tugas yang diberikan.
4. Mengajak pihak lain (unit/instansi) untuk terlibat dalam penyelesaian pekerjaan bersama.
5. Membangun kerja sama/kemitraan baru dengan pihak lain yang menghasilkan manfaat nyata bagi organisasi.

### 10.4 Template umpan balik (Excel kolom N–R)

**BP**
1. Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut.
2. Pahami kebutuhan nyata masyarakat, jangan sekadar menjalankan prosedur formal.
3. Sudah sesuai standar; tingkatkan dengan lebih berinisiatif tanpa menunggu diminta.
4. Pertahankan respons yang cepat dan solutif ini secara konsisten.
5. Pertahankan dan tularkan inisiatif perbaikan layanan ini ke rekan kerja.

**AK**
1. Hentikan penggunaan aset kantor di luar peruntukannya; patuhi aturan BMN.
2. Tingkatkan ketelitian kerja dengan membiasakan cek ulang sebelum menyerahkan hasil.
3. Sudah disiplin; lebih proaktif melaporkan penggunaan sumber daya tanpa diminta.
4. Pertahankan transparansi dan ketepatan waktu pelaporan ini.
5. *(kosong di Excel — seed `""`)*

**KP**
1. Ikuti pelatihan yang ditugaskan dengan sikap terbuka untuk mengembangkan diri.
2. Perbarui cara kerja sesuai kebutuhan terkini, jangan bertahan di cara lama.
3. Sudah baik menerapkan pelatihan; mulai belajar mandiri tanpa menunggu penugasan.
4. Pertahankan belajar mandiri ini dan mulai bagikan ke rekan kerja.
5. Pertahankan peran sebagai mentor bagi rekan kerja.

**HM**
1. Hentikan sikap membeda-bedakan rekan kerja; perlakukan semua secara setara.
2. Biasakan menawarkan bantuan saat melihat rekan kerja kesulitan.
3. Sudah bersedia membantu; lebih peka tanpa harus diminta dulu.
4. Pertahankan kepekaan menawarkan bantuan secara proaktif ini.
5. Pertahankan peran sebagai penengah yang menjaga keharmonisan tim.

**LY**
1. Hentikan segera membocorkan informasi rahasia instansi; jaga kerahasiaannya.
2. Sampaikan keluhan kebijakan lewat saluran internal, bukan di ruang publik.
3. Sudah patuh pada kebijakan; tingkatkan kedisiplinan menjaga kerahasiaan data.
4. Pertahankan kedisiplinan menjaga kerahasiaan data ini secara konsisten.
5. Pertahankan keberanian membela nama baik instansi secara santun dan berbasis fakta.

**AD**
1. Bersikap terbuka terhadap perubahan sistem kerja, jangan menolaknya.
2. Segera terapkan perubahan begitu diinformasikan, tanpa menunggu diingatkan berulang.
3. Sudah cukup adaptif; mulai berani usulkan ide perbaikan, bukan hanya menyesuaikan diri.
4. Pertahankan inisiatif usulan ide baru ini dan coba terapkan bertahap.
5. Pertahankan semangat menjadi pelopor inovasi dan berbagi ke rekan kerja.

**KB**
1. Bersikap terbuka untuk bekerja sama saat dibutuhkan pihak lain.
2. Tawarkan diri terlibat kerja sama lintas unit, jangan menunggu ditugaskan.
3. Sudah berkontribusi baik; mulai ambil inisiatif mengajak pihak lain terlibat.
4. Pertahankan inisiatif mengajak kolaborasi ini dan jajaki kemitraan lebih luas.
5. Pertahankan kemampuan membangun kemitraan strategis dan bagikan strateginya ke rekan kerja.

### 10.5 User demo

| NIP | Nama | Email | Role | Unit |
|-----|------|-------|------|------|
| 19750105199203001 | Anik Sri Handayani | anik@kemkes.go.id | admin, assessor, employee, leadership | Seksi Kinerja |
| 19870217200912001 | Mohamad Arif Mujaki | arif.mujaki@kemkes.go.id | assessor, employee | Seksi Kinerja |
| 19800605200812002 | Ani Suryani | ani.suryani@kemkes.go.id | employee | Seksi Kinerja |
| 19650312197803001 | Budi Santoso | budi.santoso@kemkes.go.id | assessor, employee, leadership | Bagian SDM |

Password demo: `Password1`. Anik menilai Arif; Arif menilai Ani. Periode demo: Q1 2026, status `active`. Pimpinan puncak (jika ada di import) tetap di-assign assessor oleh admin.

---

## 11. Arsitektur & struktur repo

```
/apps/web          React 19 + Vite + Tailwind CSS + TanStack Router
/apps/api          Bun 1.4 + Elysia + TypeScript
/packages/db       Drizzle ORM + SQLite, migrations, seed
/packages/shared   Tipe, rumus skor, getCategory(), konstanta nilai dasar
```

Monorepo workspace Bun. Rumus skor tidak diduplikasi mentah — satu modul `calculateScores()` + `getCategory()` di-shared, frontend preview memakai hasil yang sama. Tes wajib: contoh 5.4.

Jangan pakai Prisma, Next.js, Solid.js, atau PostgreSQL di V2.

**Auth**: JWT di httpOnly cookie.  
**File PDF**: generate di server (disarankan) atau client jsPDF; hasil harus memuat skor kanonik dari API, bukan hitungan ulang yang berbeda.  
**Upload**: CSV di memori, max 5 MB, proses sinkron untuk V2 (<3000 baris).

---

## 12. Non-fungsional

| Aspek | Target V2 |
|-------|-----------|
| Page load | < 3 detik |
| API p95 | < 500 ms |
| List | Pagination 50 |
| Agregat | Query langsung; cache in-memory 5 menit jika perlu |
| Concurrent | Cukup untuk ratusan user; SQLite WAL mode |
| Uptime | Best-effort prototype; backup file SQLite harian jika deploy |
| Keamanan | HTTPS di deploy, bcrypt, RBAC, validasi input, rate limit login 5/15 menit, audit mutasi penilaian & master data |
| Aksesibilitas | Keyboard, label, kontras 4.5:1 |
| Privasi | Pegawai hanya lihat milik sendiri; pimpinan terbatas unit; jangan log body password |

Bukan target V2: 99.5% SLA, pentest formal, GDPR, cegah print/screenshot.

---

## 13. Kriteria penerimaan (per fase)

### Fase A — Fondasi

- [ ] Login / logout / ganti password pertama
- [ ] User multi-role melihat menu yang benar
- [ ] Seed 7 nilai, 21 panduan, 5 BARS, 35 jangkar, 34 feedback terisi + 1 AK L5 kosong
- [ ] Tes unit rumus = contoh 5.4 persis (82.29, 80, 108, 60 + kategori)

### Fase B — Admin operasi

- [ ] CRUD periode + validasi overlap / satu active
- [ ] Import CSV: create/update user, unit, assignment
- [ ] Override assessor; tolak self-assess
- [ ] Tidak bisa activate jika masih `unassigned`
- [ ] Edit teks master data; tidak ada tombol create/delete nilai dasar

### Fase C — Penilaian

- [ ] Form 7 radio + preview skor benar
- [ ] Ganti level → template feedback berganti
- [ ] Draft tidak terlihat pegawai
- [ ] Submit membuat 7 feedback rows + notifikasi
- [ ] Revisi menimpa record, history tercatat
- [ ] Periode closed menolak submit/revisi
- [ ] PDF assessor berisi skor + feedback

### Fase D — Pegawai & pimpinan

- [ ] Pegawai lihat skor, kategori, radar, feedback yang diizinkan
- [ ] Pegawai tidak punya tombol PDF
- [ ] Riwayat + chart jika ≥2 periode
- [ ] Dashboard pimpinan filter periode/unit
- [ ] Ranking unit dan drill daftar pegawai
- [ ] Ekspor CSV/PDF admin & pimpinan
- [ ] Audit log searchable

### Fase E — Pengaman

- [ ] Endpoint role-guard (pegawai tidak bisa GET penilaian orang lain)
- [ ] Leadership tidak melihat unit di luar pohonnya
- [ ] Rate limit login
- [ ] Help/FAQ statis

---

## 14. Urutan build untuk Cursor

Kerjakan berurutan. Jangan loncat ke dashboard pimpinan sebelum rumus dan form penilaian selesai.

1. Init monorepo, lint, env (`DATABASE_URL`, `JWT_SECRET`)
2. `packages/shared` konstanta + `calculateScores()` + tes contoh 5.4
3. Drizzle schema + migrate + seed master + user demo
4. Elysia auth + `/api/me` + guard role
5. UI shell: login, layout, sidebar per role
6. Admin: unit, user, periode
7. Admin: import CSV + assignment
8. Admin: master data edit
9. Assessor: list + form + draft/submit + revisi
10. Employee: hasil + radar + riwayat
11. Leadership: dashboard + laporan + ranking (**hanya setelah langkah 9 hijau**)
12. Export PDF/CSV
13. Notifikasi in-app + reminder
14. Audit viewers

Jangan implementasikan email. Estimasi kasar jika dikerjakan manusia: 8–10 minggu. Untuk vibecoding, pecah per fase A→E dan hentikan setelah tiap fase hijau.

---

## 15. Glosarium

| Istilah | Arti |
|---------|------|
| BARS | Behaviorally Anchored Rating Scale — skor 1–5 dengan deskripsi perilaku |
| Jangkar BARS | Kalimat perilaku pada radio button (bukan umpan balik) |
| Nilai Dasar BerAKHLAK | 7 nilai ASN |
| Budaya Kerja Kemenkes | Eksekusi Efektif, Cara Kerja Baru, Pelayanan Unggul |
| Skala 120 | Konversi dari level 1–5 |
| Assessor | Pejabat penilai / atasan langsung |
| Periode | Triwulan kerja + jendela penilaian sampai deadline |

FAQ tetap:
- Data disimpan permanen (arsip), untuk tren dan audit
- V2: 1 assessor per pegawai per periode
- Pegawai melihat umpan balik lengkap yang diizinkan penilai
- Skor tidak bisa diketik manual; hanya pilih level

---

## 16. Temuan review (untuk jejak)

1. **Contoh skor salah di PRD lama.** Sheet2 total 24 → 82.29 (Excel menampilkan 82 tanpa desimal; V2 memakai `ROUND(...,2)` sesuai catatan Sheet2). Angka 75.43 di Sheet3 adalah rata-rata set level **lain** (total 22).
2. **Kategori capaian.** Keputusan produk: Sangat Baik 110–120, Baik 90–109, Butuh Perbaikan 70–89, Kurang 50–69, Sangat Kurang 0–49.
3. **Satu kolom `role` tidak cukup.** Atasan selalu pegawai juga. Diubah ke `user_roles`.
4. **4 persona vs 3 modul.** Pimpinan masuk V2, dibangun Fase D setelah penilaian jalan.
5. **Feedback UI berlebihan.** Disederhanakan (D5).
6. **Master data CRUD penuh vs seed.** V2 hanya edit teks (D6).
7. **Nama tabel feedback tidak konsisten.** Dipakai jamak + snake.
8. **Jangkar BARS 35 teks** sekarang lengkap dari Excel Sheet1 kolom I–M.
9. **Draft ada di tombol, tidak ada di skema.** Ditambah status `draft`.
10. **GDPR tidak relevan.** Diganti UU PDP.
11. **PDF pegawai.** Tidak ada unduhan resmi.
12. **Excel.** File ada di `docs/`. Umpan balik Akuntabel L5 kosong — tidak dikarang.
13. **Kolom F Excel (skala 40–100, 7 poin)** bukan rumus V2; jangan diimplementasikan.
14. **Email/SMTP** di-drop untuk prototype.

---

## 17. Keputusan produk (terkunci 2 Sep 2026)

| Pertanyaan | Jawaban |
|------------|---------|
| Ambang kategori | Sangat Baik 110–120, Baik 90–109, Butuh Perbaikan 70–89, Kurang 50–69, Sangat Kurang 1–49 (di kode: 0–49) |
| File Excel | Ada di `docs/2026.09.01 V2 Konsep Panduan Penilaian Perilaku BerAKHLAK (1).xlsx` |
| SMTP | Tidak perlu |
| Dashboard pimpinan | Setelah penilaian jalan (Fase D) |
| Stack | TypeScript, Bun 1.4, Elysia, Drizzle ORM, SQLite, React 19, Tailwind CSS |
| Pimpinan puncak | Tetap di-assign admin (prototype) |
| Buka kembali periode | Ya, `closed → active` + audit |

Tidak ada pertanyaan terbuka yang menahan build. Jika Excel Akuntabel L5 nanti diisi, cukup edit seed / master data.
