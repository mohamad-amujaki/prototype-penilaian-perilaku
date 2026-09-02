# PRD: Web Apps Penilaian Perilaku Kerja Pegawai ASN Kemenkes
## Version 2.0 (Production Ready)

**Last Updated**: September 2, 2026  
**Status**: Ready for Development  
**Tech Stack**: TypeScript, Bun 1.4, Elysiajs, Drizzle ORM, SQLite  
**Deployment Target**: Kemenkes Internal (eKinerja Portal Integration)

---

## 📋 EXECUTIVE SUMMARY

Sistem penilaian perilaku kerja pegawai ASN Kemenkes berbasis **7 Nilai Dasar BerAKHLAK** (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) dengan scoring pada skala BARS Level 1-5 dan automatic mapping ke 3 Budaya Kerja Kemenkes (Eksekusi Efektif, Cara Kerja Baru, Pelayanan Unggul).

**Core Features**:
- 3 role-based modules: Admin, Pejabat Penilai, Pegawai
- Period-based assessment (Q1-Q4, triwulan)
- Automatic score calculation & mapping budaya kerja
- One assessment per employee per period (overwrite mode)
- Aggregated reporting for top leadership only
- Compliance dengan PermenPANRB 6 Tahun 2022 & UU 20 Tahun 2023

---

## 1. PRODUCT OVERVIEW

### 1.1 Context & Problem Statement

**Background**:
- Kemenkes memerlukan sistem terstandar untuk menilai perilaku kerja ASN sesuai nilai BerAKHLAK
- Saat ini menggunakan form manual/Excel yang sulit ditrack dan diagregasi
- Perlu integrasi dengan e-Kinerja Portal Kemenkes (HRIS existing)

**Gaps**:
1. Tidak ada single source of truth untuk semua assessment
2. Proses review/approval belum terstruktur
3. Laporan agregat sulit dihasilkan
4. Pegawai tidak bisa melihat hasil penilaian mereka

**Objectives**:
1. ✅ Centralized assessment platform dengan scoring standardized
2. ✅ Automatic calculation sesuai formula PermenPANRB
3. ✅ Role-based workflow (admin → assessor → employee view)
4. ✅ Aggregated reporting untuk leadership decision-making
5. ✅ Audit trail lengkap (siapa nilai siapa, kapan, skor apa)

### 1.2 Scope (V2)

**In Scope**:
- ✅ 3 modul: Admin, Pejabat Penilai, Pegawai
- ✅ Penilaian 7 Nilai Dasar BerAKHLAK (1 skor per nilai dasar)
- ✅ Period management (Q1-Q4 standardized)
- ✅ Automatic score calculation + mapping budaya kerja
- ✅ Dashboard individual & aggregated (top leadership only)
- ✅ PDF export untuk laporan
- ✅ Basic user authentication (email/password, OTP later)

**Out of Scope (V3+)**:
- ❌ 360-degree review (V2 hanya atasan langsung)
- ❌ Advanced analytics/ML (V2 hanya basic aggregation)
- ❌ Mobile app (V2 web only)
- ❌ Integration dengan HRIS real-time (manual import/export dulu)
- ❌ SSO/LDAP (V2 simple auth, V3+ add LDAP/SSO)

---

## 2. USER PERSONAS & JOURNEYS

### 2.1 User Personas

#### A. **Admin Kemenkes** (Tim Kerja Pengelolaan Kinerja)
- **Role**: System administrator + period manager
- **Primary Goal**: Setup penilaian, assign assessor, manage periode, generate reports
- **Pain Points**: Tracking 1000+ pegawai, ensuring consistency, deadline management
- **Frequency**: Daily/Weekly (period setup), Monthly (reporting)

#### B. **Pejabat Penilai** (Atasan/Supervisor)
- **Role**: Conduct assessment untuk pegawai di unitnya
- **Primary Goal**: Input penilaian akurat, beri feedback konstruktif
- **Pain Points**: Banyak pegawai, standar scoring tidak jelas, feedback sulit ditulis
- **Frequency**: Monthly (per triwulan) dalam window 1 bulan

#### C. **Pegawai ASN** (Yang Dinilai)
- **Role**: Lihat hasil penilaian, terima feedback
- **Primary Goal**: Understand kekuatan & area pengembangan
- **Pain Points**: Tidak tahu hasil sampai notifikasi manual, tidak ada clear feedback
- **Frequency**: Monthly (lihat hasil), Quarterly (formal result)

#### D. **Pimpinan Puncak** (Eselon I)
- **Role**: Dashboard high-level, review agregat per unit
- **Primary Goal**: Monitor kualitas SDM, identify gaps, strategic planning
- **Pain Points**: Laporan lambat, tidak real-time, aggregate manual
- **Frequency**: Monthly/Quarterly reporting

### 2.2 User Journeys (Happy Path)

#### Admin: Setup Penilaian Triwulan
```
1. Login Dashboard Admin
2. Create Periode Baru (e.g., "Q1 2026, Jan 30 - Apr 30")
3. Import/Upload List Pegawai (dari CSV)
4. Auto-assign Assessor (atasan langsung per pegawai)
   └─ Option: Manual override per pegawai jika dibutuhkan
5. Set Deadline Penilaian (e.g., "Selesai 30 April 2026")
6. Send Notification ke Assessor
7. Monitor Progress (dashboard: 50% selesai, 30% pending)
8. View Reports (agregat per unit, per budaya kerja)
9. Export to PDF/CSV
```

#### Pejabat Penilai: Conduct Assessment
```
1. Login Dashboard Pejabat Penilai
2. View Daftar Pegawai Binaan (hanya unit mereka)
3. Click Pegawai A → Start Assessment
4. Input Skor untuk 7 Nilai Dasar (Likert 1-5)
   └─ Each nilai dasar punya panduan perilaku (BARS)
   └─ Show preview: skor terpilih → behavior description
5. Optional: Add Feedback Perbaikan (text field)
6. Review Hasil:
   └─ Total Score (0-35)
   └─ Score Skala 120 (formula: (total/35)*120)
   └─ 3 Budaya Kerja Score (auto-calculated)
7. Save & Submit
8. Assessor dapat print/download resume untuk employee
```

#### Pegawai: View Assessment Result
```
1. Login Dashboard Pegawai
2. View Status Penilaian:
   └─ "Sudah dinilai" + tanggal penilaian
3. Click untuk lihat Detail:
   └─ Skor per Nilai Dasar (read-only)
   └─ Total Score Skala 120 (read-only)
   └─ Budaya Kerja Breakdown (read-only)
   └─ Umpan Balik Perbaikan Perilaku (jika ada)
4. NOT ALLOWED: Download report, edit, share
5. Optional: Pencapaian Trend (history line chart dari periode lalu)
```

#### Pimpinan: Monitor Agregat
```
1. Login Dashboard Pimpinan
2. View Laporan Agregat:
   └─ Average Score per Nilai Dasar (per unit)
   └─ Distribusi Skor (chart: berapa orang level 1, 2, 3, 4, 5)
   └─ Budaya Kerja Profile (radar chart: Eksekusi/Cara Kerja/Pelayanan)
   └─ Trend vs Periode Lalu (if data available)
3. Filter by Unit/Eselon/Periode
4. Export Report (PDF)
```

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Authentication & Authorization

#### 3.1.1 Authentication Methods
- **V2**: Email + Password (simple, no SSO yet)
- **V3+**: LDAP/AD integration untuk auto-sync Kemenkes directory

#### 3.1.2 Authorization (Role-Based Access Control)

| Feature | Admin | Assessor | Employee | Leadership |
|---------|-------|----------|----------|------------|
| **Setup Periode** | ✅ | ❌ | ❌ | ❌ |
| **Manage Assessor Assignment** | ✅ | ❌ | ❌ | ❌ |
| **Conduct Assessment** | ❌ | ✅ | ❌ | ❌ |
| **View Own Assessment** | ✅ (all) | ✅ (own only) | ✅ (own) | ❌ |
| **View Unit Assessment** | ✅ (all) | ✅ (own unit) | ❌ | ✅ (own unit+) |
| **View Agregat Report** | ✅ | ❌ | ❌ | ✅ |
| **Export PDF** | ✅ | ✅ (own assess) | ❌ (view only) | ✅ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ |

---

### 3.2 Admin Module

#### 3.2.1 Dashboard & Navigation
```
Admin Dashboard
├── Home (KPI: total periode, assessment completion %, last sync)
├── Manajemen Periode
├── Manajemen Pengguna & Assessor
├── Manajemen Data Pegawai
├── Laporan & Export
└── Pengaturan Sistem
```

#### 3.2.2 Manajemen Periode (Assessment Period Management)

**Feature: Create & Edit Periode**
- Fields:
  - `Nama Periode` (e.g., "Q1 2026")
  - `Quarter` (enum: Q1, Q2, Q3, Q4)
  - `Tahun` (int: 2026)
  - `Tanggal Mulai` (date: 01 Jan 2026)
  - `Tanggal Selesai` (date: 31 Mar 2026)
  - `Deadline Penilaian` (date: 30 Apr 2026)
  - `Status` (enum: draft, active, closed, archived)
  - `Deskripsi` (optional)

- Validasi:
  - ✅ Tidak boleh ada 2 periode active bersamaan untuk tahun yang sama
  - ✅ Deadline harus lebih besar dari tanggal selesai
  - ✅ Tidak boleh membuat periode dengan tanggal yang overlap
  - ✅ Quarter harus unique per tahun

**Feature: List & Filter Periode**
- Sort: By year DESC, by quarter (Q4→Q1)
- Filter: Status, Tahun
- Actions per periode: Edit, View Progress, Close Period, Archive, Delete (if draft)

**Feature: Period Progress Dashboard**
- Metrics:
  - Total Pegawai dalam periode: X orang
  - Sudah dinilai: Y (%) progress bar
  - Belum dinilai: Z orang
  - Overdue (assessment melewati deadline): A orang
- Table: List assessor dengan status (selesai/pending)
- Action: Send Reminder (bulk email ke assessor belum selesai)

#### 3.2.3 Manajemen Assessor Assignment

**Feature: Assign Assessor**
- Auto-assign: Upload CSV pegawai, sistem automatically assign atasan langsung sebagai assessor
  - CSV Format: `NIP | Nama | Unit | NIP_Atasan | Nama_Atasan`
  - Logic: Match NIP_Atasan dengan user di system, jika tidak ada create placeholder
  
- Manual override:
  - View semua pegawai dalam periode
  - Per pegawai, bisa change assessor
  - Validation: Assessor harus user terdaftar di system

**Feature: Bulk Notification**
- Select periode → Send email ke semua assessor
- Template: "Anda ditugaskan menilai X pegawai untuk periode Q1 2026. Deadline: 30 April 2026. [Klik link untuk mulai]"

#### 3.2.4 Manajemen Data Pegawai

**Feature: Upload/Import Pegawai**
- Support: CSV, Excel
- Fields Required:
  - `NIP` (unique identifier)
  - `Nama Pegawai`
  - `Pangkat/Golongan`
  - `Unit/Bagian`
  - `Jabatan`
  - `Email`
  - `NIP Atasan` (untuk matching assessor)

- Auto-create User:
  - Sistem auto-generate username (default: email atau NIP)
  - Set temporary password (hint: default password rules Kemenkes)
  - Send welcome email dengan login credentials

- Conflict Resolution:
  - Jika NIP sudah exist: update record, don't duplicate
  - Jika email sudah exist: merge atau notify admin

**Feature: Manage Users**
- CRUD users
- Reset password
- Enable/disable user
- View user's roles & assessor assignments

#### 3.2.5 Laporan & Export

**Feature: Aggregated Report (Dashboard)**
- Available untuk: **Admin hanya** (untuk transparency/audit)
- Views:
  - By Periode
  - By Unit
  - By Nilai Dasar (average distribution)
  - By Budaya Kerja (average + radar chart)

- Metrics per report:
  - Total assessed employees
  - Average score per nilai dasar
  - Distribution chart (1-5 level distribution)
  - Unit comparison (ranked by average score)
  - Trend (if multiple periods available)

**Feature: Export Reports**
- Format: PDF, CSV
- Options:
  - Individual assessment record (per pegawai + assessor feedback)
  - Unit summary (average per unit)
  - Full report (all periode + all pegawai)

**Feature: Audit Log**
- Tamper-proof log: siapa create/edit/submit assessment, timestamp, IP, changes
- Searchable by: periode, pegawai, assessor, date range
- Export sebagai CSV untuk compliance

#### 3.2.6 Pengaturan Sistem

**Feature: System Configuration**
- Fields:
  - `Organization Name` (Kemenkes Branding)
  - `Logo URL` (for header/footer)
  - `Email Notifications` (enable/disable, sender)
  - `Scoring Scale Max` (fixed: 120)
  - `BARS Level Descriptions` (editable untuk custom descriptions per organisasi)
  - `Budaya Kerja Mapping` (view/edit mapping values)
  - `Password Policy` (min length, complexity, expiry)

---

### 3.3 Pejabat Penilai Module

#### 3.3.1 Dashboard & Navigation
```
Pejabat Penilai Dashboard
├── Home (KPI: total pegawai, assessment progress, upcoming deadline)
├── Daftar Pegawai Binaan (filter by periode)
├── Conduct Assessment
├── View My Submissions
└── Laporan Sederhana
```

#### 3.3.2 Daftar Pegawai Binaan

**Feature: List Pegawai**
- Table columns:
  - NIP, Nama, Jabatan, Status Penilaian (Belum Dinilai | Sudah Dinilai | Revisi)
  - Tanggal Penilaian (if sudah dinilai)
  - Skor Total (skala 120, if sudah dinilai)
  - Action: [Edit/View]

- Filter & Sort:
  - Filter by: Periode (dropdown), Status
  - Sort by: NIP, Nama, Skor
  - Search: by NIP atau Nama

- Progress Indicator:
  - "X dari Y pegawai sudah dinilai (XX%)" progress bar
  - "Deadline: 30 April 2026" (countdown di header)

#### 3.3.3 Conduct Assessment

**Feature: Assessment Form**

Step 1: Introduction & Instruction
```
Penilaian Perilaku Kerja - [Nama Pegawai]
NIP: [NIP], Jabatan: [Jabatan]
Periode: Q1 2026
Deadline: 30 April 2026

Instruksi:
Pilih tingkat perilaku pegawai untuk setiap Nilai Dasar BerAKHLAK pada skala 1-5.
Setiap pilihan mewakili deskripsi perilaku spesifik (lihat panduan di bawah).
```

Step 2: Scoring Interface (7 Nilai Dasar)
```
Untuk setiap Nilai Dasar:
┌─────────────────────────────────────────┐
│ 1. Berorientasi Pelayanan               │
│                                         │
│ Pilih Tingkat Perilaku:                │
│ ○ Level 1 - Kontraproduktif            │
│   "Membiarkan keluhan masyarakat tidak  │
│    ditindaklanjuti hingga berlarut-     │
│    larut"                              │
│                                         │
│ ○ Level 2 - Reaktif Minim Inisiatif    │
│   "Melayani sesuai jam kerja formal     │
│    tanpa berusaha memahami kebutuhan..." │
│                                         │
│ ○ Level 3 - Sesuai Standar             │
│   "Menyelesaikan permintaan layanan     │
│    sesuai standar prosedur..."          │
│                                         │
│ ○ Level 4 - Proaktif Tanpa Diminta    │
│   "Menindaklanjuti keluhan/kebutuhan    │
│    dengan cepat dan memberikan solusi..." │
│                                         │
│ ○ Level 5 - Role Model                 │
│   "Mengusulkan & menerapkan perbaikan   │
│    layanan atas inisiatif sendiri..."   │
│                                         │
│ [Show BARS Guidance Collapsible]        │
└─────────────────────────────────────────┘
```

- Interaction:
  - Radio button untuk select satu level per nilai dasar
  - Hover/Click untuk expand BARS guidance
  - Real-time preview: "Saat ini dipilih: Level 4"

Step 3: Score Calculation & Preview
```
┌─────────────────────────────────────────┐
│ RINGKASAN PENILAIAN - PREVIEW           │
├─────────────────────────────────────────┤
│ Nilai Dasar         │ Skor │ Keterangan │
├─────────────────────┼──────┼───────────┤
│ Berorientasi Pelayanan    │ 1.0  │ Level 1   │
│ Akuntabel           │ 2.0  │ Level 2   │
│ Kompeten            │ 5.0  │ Level 5   │
│ Harmonis            │ 4.0  │ Level 4   │
│ Loyal               │ 3.0  │ Level 3   │
│ Adaptif             │ 4.0  │ Level 4   │
│ Kolaboratif         │ 5.0  │ Level 5   │
├─────────────────────┴──────┴───────────┤
│ TOTAL SKOR: 24/35                      │
│ SKOR SKALA 120: 82.29                  │
├─────────────────────────────────────────┤
│ BUDAYA KERJA KEMENKES:                  │
│ • Eksekusi Efektif: 72.00               │
│ • Cara Kerja Baru: 108.00               │
│ • Pelayanan Unggul: 48.00               │
└─────────────────────────────────────────┘
```

Step 4: Feedback (Optional)
```
┌─────────────────────────────────────────┐
│ UMPAN BALIK PERBAIKAN PERILAKU          │
│ (Opsional - untuk membantu pegawai)     │
│                                         │
│ Feedback per Level BARS:                │
│ ☐ Berorientasi Pelayanan (Level 1)     │
│   "Segera tindak lanjuti setiap keluhan│
│    maksimal 1x24 jam..."                │
│                                         │
│ ☐ Kompeten (Level 5)                   │
│   "Pertahankan peran sebagai mentor     │
│    bagi rekan kerja."                   │
│                                         │
│ [Additional Comment Field]              │
│ ┌────────────────────────────────────┐ │
│ │ (Max 500 karakter)                 │ │
│ │ Masukan tambahan untuk pengembangan │ │
│ │ pegawai...                          │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Step 5: Confirm & Submit
```
[ ← Back ]  [Save Draft]  [Submit →]

Konfirmasi:
- Saya telah memberikan penilaian yang jujur dan adil
- Saya siap untuk memberikan feedback kepada pegawai
- [Checkbox] Setuju
```

**Validasi Input**:
- ✅ Semua 7 nilai dasar HARUS dipilih (no empty)
- ✅ Feedback characters max 500
- ✅ Submit hanya setelah semua values terisi

**Post-Submit**:
- Show success message: "Penilaian berhasil disimpan. Pegawai akan menerima notifikasi."
- Option: Print/Download PDF (resume untuk diberikan ke pegawai)
- Redirect ke: View Submissions list atau Dashboard

#### 3.3.4 View My Submissions

**Feature: List Semua Penilaian yang Sudah Disubmit**
- Table columns:
  - Pegawai NIP, Nama, Periode, Tanggal Submit, Total Skor, Status (Submitted/Revised)
  - Action: [View/Print] [Edit (if allowed)] [Download PDF]

- Filter: Periode, Status
- Sort: By date DESC (latest first)

- Actions:
  - **View**: Read-only summary penilaian + feedback
  - **Print**: Format untuk printed assessment record
  - **Edit**: Revisi penilaian (if periode still active)
    - Validasi: Hanya bisa edit jika periode belum closed
    - Track changes: Log timestamp siapa edit kapan
  - **Download PDF**: Generated report untuk personal file atau share ke pegawai

#### 3.3.5 Laporan Sederhana

**Feature: My Statistics**
- Cards:
  - "Total Pegawai Binaan": X orang
  - "Sudah Dinilai": Y (X%)
  - "Deadline": Z hari lagi
- Chart: Distribution skor (simple bar chart: berapa level 1, 2, 3, 4, 5)
- Optional: Compare dengan rata-rata unit (jika ada multiple assessor)

---

### 3.4 Pegawai (Employee) Module

#### 3.4.1 Dashboard & Navigation
```
Employee Dashboard
├── Home (status penilaian, upcoming assessment)
├── Lihat Penilaian (view result jika sudah ada)
├── Riwayat Penilaian (historical trend)
└── Bantuan & Panduan
```

#### 3.4.2 Status Penilaian

**Feature: Assessment Status Card**
```
┌────────────────────────────────────────┐
│ STATUS PENILAIAN KINERJA PERILAKU       │
├────────────────────────────────────────┤
│ Periode: Q1 2026 (Jan - Mar 2026)      │
│ Status: ✅ Sudah Dinilai               │
│ Tanggal Penilaian: 25 April 2026       │
│ Dinilai oleh: Anik Sri Handayani, M.A  │
│                                        │
│ Deadline: 30 April 2026 (5 hari lagi)  │
│                                        │
│ [Lihat Detail Penilaian →]             │
└────────────────────────────────────────┘
```

**Feature: Multi-Periode Status**
- Timeline view atau list of all periods
- Shows: Periode, Status (Sudah/Belum), Tanggal, Assessor name
- For completed: skor preview (total skala 120)

#### 3.4.3 Lihat Penilaian (View Assessment Result)

**Feature: Assessment Result Display**
```
HASIL PENILAIAN PERILAKU KERJA
Pegawai: Mohamad Arif Mujaki, M.AP
NIP: 19870217200912001
Jabatan: Kepala Seksi X
Periode: Q1 2026
Dinilai oleh: Anik Sri Handayani, M.A (25 April 2026)

┌─────────────────────────────────────────────────────────┐
│ SKOR PER NILAI DASAR BERAKHLAK                          │
├────────────────────────┬────────────┬─────────────────┤
│ Nilai Dasar            │ Level      │ Skor Skala 120  │
├────────────────────────┼────────────┼─────────────────┤
│ 1. Berorientasi Pelayanan   │ Level 1    │ 24.00       │
│ 2. Akuntabel           │ Level 2    │ 48.00       │
│ 3. Kompeten            │ Level 5    │ 72.00       │
│ 4. Harmonis            │ Level 3    │ 72.00       │
│ 5. Loyal               │ Level 4    │ 96.00       │
│ 6. Adaptif             │ Level 5    │ 120.00      │
│ 7. Kolaboratif         │ Level 4    │ 96.00       │
├────────────────────────┴────────────┴─────────────────┤
│ TOTAL SKOR: 24/35                                     │
│ NILAI PERILAKU (SKALA 120): 75.43                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PROFIL BUDAYA KERJA KEMENKES                            │
├────────────────────┬──────────┬───────────────────────┤
│ Budaya Kerja       │ Skor 120 │ Kategori Capaian      │
├────────────────────┼──────────┼───────────────────────┤
│ Eksekusi Efektif   │ 72       │ Kurang (65-80%)       │
│ Cara Kerja Baru    │ 108      │ Baik (80-90%)         │
│ Pelayanan Unggul   │ 48       │ Sangat Kurang (<65%)  │
└────────────────────┴──────────┴───────────────────────┘

Visualisasi Radar Chart:
[Embedded SVG: 3-axis radar chart showing scores]
```

**Feature: Umpan Balik Perbaikan (Feedback)**
```
UMPAN BALIK PERBAIKAN PERILAKU

Berorientasi Pelayanan (Level 1):
→ "Segera tindak lanjuti setiap keluhan masyarakat/pengguna 
   layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut."
→ "Pahami kebutuhan nyata masyarakat, jangan sekadar 
   menjalankan prosedur formal."

Adaptif (Level 5):
→ "Pertahankan semangat menjadi pelopor inovasi dan 
   berbagi ke rekan kerja."

[Additional Assessor Comment if any]
────────────────────
"Arif sudah menunjukkan komitmen untuk inovasi dan adaptasi 
terhadap sistem baru. Ke depan, fokus pada responsiveness 
terhadap keluhan pelanggan agar lebih holistik."
```

**Feature: Read-Only (No Downloads)**
- ✅ Dapat melihat semua detail skor & feedback
- ❌ NOT allowed: Download PDF, export, screenshot
- ✅ Dapat screenshot (browser-level, tidak bisa prevent)
- ✅ Dapat print (via browser print function)

#### 3.4.4 Riwayat Penilaian (Historical Trend)

**Feature: Historical View**
- Table: Periode | Assessor | Skor Skala 120 | Budaya Kerja (3 values) | View Detail
- Sort: Reverse chronological (latest first)
- Chart: Line chart trend (if multiple periods)
  - X-axis: Periode (Q1, Q2, Q3, Q4)
  - Y-axis: Skor (0-120)
  - 3 lines: Eksekusi Efektif, Cara Kerja Baru, Pelayanan Unggul
  - Show progression & areas of improvement

**Insight**:
```
Kesimpulan Trend (Auto-generated):
- Skor Keseluruhan: Stabil di 75+ (baik)
- Area Kuat: Adaptif & Kolaboratif (konsisten level 4-5)
- Area Pengembangan: Berorientasi Pelayanan (naik dari L1 → L2)
- Rekomendasi: Fokus pada "Pelayanan Unggul" untuk 
  pengembangan ke depan.
```

#### 3.4.5 Bantuan & Panduan

**Feature: Help Center (In-App)**
- Collapsible section:
  - FAQ: "Apa itu nilai BerAKHLAK?", "Bagaimana skor dihitung?", "Kapan penilaian dilakukan?"
  - Glossary: Definisi istilah (Nilai Dasar, BARS, Budaya Kerja, Skala 120, dll)
  - Download: PDF Panduan BerAKHLAK (dari file Excel yang ada)
  - Contact: Email Tim Kerja Pengelolaan Kinerja untuk pertanyaan

---

### 3.5 Pimpinan (Leadership) Module

#### 3.5.1 Dashboard & Navigation
```
Leadership Dashboard
├── Home (KPI Cards + Trend)
├── Laporan Agregat per Unit
├── Laporan Agregat per Nilai Dasar
├── Laporan Agregat per Budaya Kerja
├── Perbandingan Unit (Ranking)
└── Export & Schedule Reports
```

#### 3.5.2 Home Dashboard (Executive Summary)

**Feature: KPI Cards (Current Period)**
```
┌────────────────┐  ┌──────────────────┐  ┌───────────────┐
│ Total Assessed │  │ Assessment       │  │ Avg Score     │
│ 2.450 Pegawai  │  │ Completion Rate  │  │ (Skala 120)   │
│ (Q1 2026)      │  │ 87%              │  │ 76.5          │
└────────────────┘  └──────────────────┘  └───────────────┘

┌──────────────────────────────────────────────────────────┐
│ Budaya Kerja Rata-Rata (Q1 2026)                         │
├──────────────────────────────────────────────────────────┤
│ Eksekusi Efektif:  74.3  ████████░░░░░░░░░░░░░░░░░░░░  │
│ Cara Kerja Baru:   81.5  ██████████░░░░░░░░░░░░░░░░░░░ │
│ Pelayanan Unggul:  62.1  ██████░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Top Performing Units (by Avg Score)                      │
├──────────────────┬───────────┬──────────────────────────┤
│ Unit             │ Avg Score │ Pegawai Assessed        │
├──────────────────┼───────────┼──────────────────────────┤
│ Seksi Kinerja    │ 82.1      │ 145 / 150 (96%)        │
│ Bagian SDM       │ 79.3      │ 92 / 98 (94%)          │
│ UPT Regional     │ 76.5      │ 1.203 / 1.200 (100%)   │
└──────────────────┴───────────┴──────────────────────────┘

Assessment Progress: 2.450 / 2.810 (87%)
[Overdue: 360 assessments still pending, deadline 30 April]
```

**Feature: Trend vs Previous Period**
```
Perbandingan Q1 2026 vs Q4 2025:
Eksekusi Efektif:    74.3 → 76.2  (↑ +1.9 points)
Cara Kerja Baru:     81.5 → 79.1  (↓ -2.4 points)
Pelayanan Unggul:    62.1 → 64.8  (↑ +2.7 points)
```

#### 3.5.3 Laporan Agregat per Unit

**Feature: Unit-Level Report**
```
Laporan Agregat per Unit - Q1 2026

Filter & Download:
[Periode ▼] [Export as PDF]

┌───────────────────────────────────────────────────────────┐
│ UNIT: Seksi Pengelolaan Kinerja                          │
├───────────────────────────────────────────────────────────┤
│ Total Pegawai Assessed: 145 / 150 (96%)                  │
│ Average Score (Skala 120): 82.1                          │
│ Assessment Completion Deadline: 30 April 2026            │
│                                                           │
│ Distribution by BARS Level:                              │
│ Level 1: 2 orang (1%)  ██                               │
│ Level 2: 8 orang (6%)  ████████                         │
│ Level 3: 32 orang (22%) ████████████████████████        │
│ Level 4: 65 orang (45%) ████████████████████████████... │
│ Level 5: 38 orang (26%) ██████████████████████████      │
│                                                           │
│ Budaya Kerja Breakdown:                                 │
│ • Eksekusi Efektif:  79.2  [████████░░░░░░░░░░░░░]     │
│ • Cara Kerja Baru:   85.3  [████████░░░░░░░░░]         │
│ • Pelayanan Unggul:  72.1  [███████░░░░░░░░░░░░░]      │
│                                                           │
│ [Embedded Radar Chart: 3-axis visualization]             │
└───────────────────────────────────────────────────────────┘
```

- Drill-down: Click unit → show list of employees with scores
- Options: Export PDF, Export CSV, Compare with other units

#### 3.5.4 Laporan per Nilai Dasar

**Feature: Value-Base Report**
```
Laporan Agregat per Nilai Dasar - Q1 2026

┌───────────────────────────────────────────────────────────┐
│ NILAI DASAR: Adaptif                                     │
├───────────────────────────────────────────────────────────┤
│ Definisi: Terus berinovasi dan antusias dalam menggerakkan│
│           serta menghadapi perubahan                     │
│                                                           │
│ Average Level: 3.8 (between Level 3 & 4)                │
│ Average Score (Skala 120): 91.4                         │
│                                                           │
│ Distribution:                                            │
│ Level 1: 15 orang (1%)   ██                            │
│ Level 2: 68 orang (3%)   ████                          │
│ Level 3: 612 orang (25%) █████████████░░░░░░░░░       │
│ Level 4: 1.247 orang (51%) ██████████████████░░░      │
│ Level 5: 458 orang (19%) ████████░░░░░░░░░░░░░░░░    │
│                                                           │
│ Trend vs Q4 2025: 3.8 → 3.6 (↓ slight decline)        │
│ Top Unit: Seksi Pengelolaan Kinerja (avg 4.1)         │
│ Bottom Unit: UPT Daerah X (avg 3.2)                   │
│                                                           │
│ Rekomendasi: Fokus training pada UPT Daerah X untuk     │
│              meningkatkan culture inovasi              │
└───────────────────────────────────────────────────────────┘
```

- 7 tabs untuk 7 nilai dasar
- Chart: distribution + trend
- Unit comparison: ranked by average level

#### 3.5.5 Laporan per Budaya Kerja

**Feature: Organizational Culture Report**
```
Laporan Agregat per Budaya Kerja Kemenkes - Q1 2026

┌───────────────────────────────────────────────────────────┐
│ BUDAYA KERJA: Eksekusi Efektif                          │
├───────────────────────────────────────────────────────────┤
│ Terdiri dari: Nilai Dasar Akuntabel, Kompeten, Loyal    │
│ Average Score (Skala 120): 74.3                         │
│ Status: Kurang (65-80%)                                 │
│                                                           │
│ Breakdown per Nilai Dasar:                              │
│ • Akuntabel:     73.1  ███████░░░░░░░░░░░░░░░░░       │
│ • Kompeten:      75.5  ███████░░░░░░░░░░░░░░░░░░     │
│ • Loyal:         74.2  ███████░░░░░░░░░░░░░░░░░░     │
│                                                           │
│ Trend (Last 4 Quarters):                                │
│ Q2 2025: 71.2  Q3 2025: 73.1  Q4 2025: 73.8  Q1 2026: 74.3│
│ Overall Trend: ↑ Positive (improving)                   │
│                                                           │
│ Unit Performance (Eksekusi Efektif):                    │
│ Top 3:                                                  │
│ 1. Seksi Pengelolaan Kinerja: 79.2                    │
│ 2. Bagian SDM: 77.1                                    │
│ 3. UPT Regional: 76.5                                  │
│                                                           │
│ Bottom 3:                                               │
│ 1. UPT Daerah X: 68.3 (perlu intervention)           │
│ 2. UPT Daerah Y: 69.1                                 │
│ 3. Seksi Administrasi: 70.5                          │
│                                                           │
│ Rekomendasi Strategis:                                 │
│ 1. Eksekusi Efektif: Kurang dari target (target: 80)   │
│    → Focus: Accountability & Quality culture           │
│    → Tindak: Coaching program untuk UPT Daerah X       │
│                                                           │
│ 2. Cara Kerja Baru: Baik (81.5, on target)            │
│    → Sustain: Continue digital transformation         │
│                                                           │
│ 3. Pelayanan Unggul: Sangat Kurang (62.1, low)       │
│    → Focus: Customer service excellence               │
│    → Tindak: Customer experience training             │
└───────────────────────────────────────────────────────────┘
```

- 3 views: Eksekusi Efektif, Cara Kerja Baru, Pelayanan Unggul
- Radar chart: show breakdown per nilai dasar
- Trend line: 4-period historical
- Actionable recommendations

#### 3.5.6 Unit Comparison & Ranking

**Feature: Leaderboard**
```
Unit Performance Ranking (Avg Score, Skala 120)

[Periode Filter: Q1 2026] [Sort by: ▼ Avg Score DESC]

┌──────────────────────────────────────────────────────────────┐
│ # │ Unit                  │ Avg Score │ Status      │ Trend  │
├──────────────────────────────────────────────────────────────┤
│ 1 │ Seksi Pengelolaan ... │ 82.1      │ Baik ✅    │ ↑ +1.5 │
│ 2 │ Bagian SDM            │ 79.3      │ Baik ✅    │ ↑ +0.8 │
│ 3 │ UPT Regional          │ 76.5      │ Cukup ⚠️  │ ↓ -1.2 │
│ 4 │ Seksi Administrasi    │ 74.2      │ Cukup ⚠️  │ → 0.0  │
│ 5 │ UPT Daerah Y          │ 69.1      │ Kurang ❌ │ ↓ -2.3 │
│ 6 │ UPT Daerah X          │ 68.3      │ Kurang ❌ │ ↓ -3.1 │
└──────────────────────────────────────────────────────────────┘

Click unit row → View detail agregat untuk unit tersebut
```

#### 3.5.7 Export & Schedule Reports

**Feature: Export Reports**
- Formats: PDF (formatted), CSV (raw data)
- Options:
  - Executive Summary (1-page dashboard)
  - Full Report (all details + analysis)
  - Unit Comparison (ranked table)
  - Budaya Kerja Analysis (3-culture breakdown)

**Feature: Schedule Reports (Future)**
- [V2]: Manual export only
- [V3+]: Schedule email reports (weekly/monthly)

---

## 4. TECHNICAL ARCHITECTURE & DATA MODEL

### 4.1 Tech Stack

```
Frontend:
  - Framework: React 19 (or Solid.js if prefer lightweight)
  - Router: Tanstack Router
  - UI: Shadcn/ui + Tailwind CSS
  - State: TanStack Query (data fetching) + Zustand (global state)
  - Charts: Recharts (bar, line, radar)
  - PDF: jsPDF + html2canvas (client-side export)

Backend:
  - Runtime: Bun 1.4
  - Framework: Elysiajs
  - ORM: Drizzle ORM
  - Database: SQLite (V2), PostgreSQL (V3+ for scaling)
  - Auth: JWT (simple, no external service)
  - Email: Nodemailer (for notifications)

DevOps:
  - Container: Docker (optional, for deployment)
  - VCS: Git (GitHub/GitLab)
  - CI/CD: GitHub Actions (simple workflow)
  - Deployment: Railway / Render / Self-hosted (Kemenkes preference)
```

### 4.2 Database Schema (Drizzle ORM)

#### Core Tables

```typescript
// users.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  nip: text('nip').unique(), // Employee ID
  role: text('role').notNull(), // 'admin' | 'assessor' | 'employee' | 'leadership'
  unitId: text('unit_id'), // Foreign key to units table
  isActive: integer('is_active').default(1),
  lastLogin: integer('last_login'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  level: text('level'), // 'eselon' | 'bagian' | 'seksi' | 'upt'
  parentUnitId: text('parent_unit_id'), // Hierarchical structure
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

// assessment_periods.ts
export const assessmentPeriods = sqliteTable('assessment_periods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // "Q1 2026"
  quarter: text('quarter').notNull(), // 'Q1' | 'Q2' | 'Q3' | 'Q4'
  year: integer('year').notNull(),
  startDate: integer('start_date').notNull(), // epoch
  endDate: integer('end_date').notNull(),
  deadlineDate: integer('deadline_date').notNull(),
  status: text('status').default('draft'), // 'draft' | 'active' | 'closed' | 'archived'
  description: text('description'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

// assessment_assignments.ts - Link assessor ke employee per period
export const assessmentAssignments = sqliteTable('assessment_assignments', {
  id: text('id').primaryKey(),
  periodId: text('period_id').notNull().references(() => assessmentPeriods.id),
  employeeId: text('employee_id').notNull().references(() => users.id),
  assessorId: text('assessor_id').notNull().references(() => users.id),
  unitId: text('unit_id').notNull().references(() => units.id),
  status: text('status').default('pending'), // 'pending' | 'submitted' | 'revised'
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
  
  // Unique constraint: one assignment per period per employee
  indexes: [createIndex('idx_period_employee_unique').on(periodId, employeeId)],
});

// assessments.ts - Actual assessment record
export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull().references(() => assessmentAssignments.id),
  periodId: text('period_id').notNull().references(() => assessmentPeriods.id),
  employeeId: text('employee_id').notNull().references(() => users.id),
  assessorId: text('assessor_id').notNull().references(() => users.id),
  
  // Scoring: 7 nilai dasar (BARS Level 1-5, stored as integer)
  nilaiBerorientasiPelayanan: integer('nilai_berorientasi_pelayanan').notNull(), // 1-5
  nilaiAkuntabel: integer('nilai_akuntabel').notNull(),
  nilaiKompeten: integer('nilai_kompeten').notNull(),
  nilaiHarmonis: integer('nilai_harmonis').notNull(),
  nilaiLoyal: integer('nilai_loyal').notNull(),
  nilaiAdaptif: integer('nilai_adaptif').notNull(),
  nilaiKolaboratif: integer('nilai_kolaboratif').notNull(),
  
  // Calculated fields (denormalized for performance)
  totalScore: integer('total_score'), // sum of all 7 scores (max 35)
  scoreScale120: decimal('score_scale_120', { precision: 5, scale: 2 }), // (totalScore/35)*120
  
  // Budaya Kerja scores (auto-calculated)
  budayaEksekusiEfektif: decimal('budaya_eksekusi_efektif', { precision: 5, scale: 2 }),
  budayaCaraKerjaBaru: decimal('budaya_cara_kerja_baru', { precision: 5, scale: 2 }),
  budayaPelayananUnggul: decimal('budaya_pelayanan_unggul', { precision: 5, scale: 2 }),
  
  // Feedback
  feedback: text('feedback'), // Optional feedback text
  
  // Metadata
  submittedAt: integer('submitted_at'),
  revisedAt: integer('revised_at'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

// assessment_history.ts - Audit trail
export const assessmentHistory = sqliteTable('assessment_history', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull().references(() => assessments.id),
  action: text('action').notNull(), // 'created' | 'updated' | 'submitted' | 'revised'
  changedBy: text('changed_by').notNull().references(() => users.id),
  changeDetails: text('change_details'), // JSON: {field: old→new}
  ipAddress: text('ip_address'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
});

// notifications.ts - Email/in-app notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'assessment_assigned' | 'deadline_reminder' | 'result_ready'
  periodId: text('period_id').references(() => assessmentPeriods.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  isRead: integer('is_read').default(0),
  sentAt: integer('sent_at'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
});
```

### 4.3 API Endpoints (RESTful)

#### Authentication
```
POST   /api/auth/register          # Admin create user
POST   /api/auth/login             # User login (email + password)
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh-token     # Refresh JWT
POST   /api/auth/reset-password    # Reset password flow
```

#### Admin Endpoints
```
# Period Management
GET    /api/admin/periods                    # List all periods
POST   /api/admin/periods                    # Create period
GET    /api/admin/periods/:id                # Get period detail
PATCH  /api/admin/periods/:id                # Update period
DELETE /api/admin/periods/:id                # Delete period (if draft)
POST   /api/admin/periods/:id/close          # Close period
GET    /api/admin/periods/:id/progress       # Get progress stats

# Assessor Assignment
GET    /api/admin/periods/:id/assignments    # List assignments
POST   /api/admin/periods/:id/assignments    # Bulk assign assessors (CSV upload)
PATCH  /api/admin/assignments/:id            # Manual override assessor
POST   /api/admin/assignments/bulk-notify    # Send notification to assessors

# User Management
GET    /api/admin/users                      # List users
POST   /api/admin/users                      # Create user
GET    /api/admin/users/:id                  # Get user detail
PATCH  /api/admin/users/:id                  # Update user
DELETE /api/admin/users/:id                  # Soft delete user
POST   /api/admin/users/:id/reset-password   # Reset user password

# Unit Management
GET    /api/admin/units                      # List units (hierarchical)
POST   /api/admin/units                      # Create unit
PATCH  /api/admin/units/:id                  # Update unit
DELETE /api/admin/units/:id                  # Delete unit

# Reporting (Admin only)
GET    /api/admin/reports/aggregated         # Aggregated report (all)
GET    /api/admin/reports/audit-log          # Audit trail
POST   /api/admin/reports/export             # Export report (PDF/CSV)

# System Configuration
GET    /api/admin/settings                   # Get system settings
PATCH  /api/admin/settings                   # Update settings
```

#### Assessor Endpoints
```
# View & Manage Assignments
GET    /api/assessor/dashboard               # Dashboard (stats)
GET    /api/assessor/employees               # List employees to assess
GET    /api/assessor/employees/:id           # Get employee detail

# Conduct Assessment
GET    /api/assessor/assessment/:assignmentId  # Get assessment form
POST   /api/assessor/assessment              # Submit assessment
PATCH  /api/assessor/assessment/:id          # Revise assessment (if allowed)
GET    /api/assessor/assessment/:id          # View submission
POST   /api/assessor/assessment/:id/pdf      # Generate PDF

# My Submissions
GET    /api/assessor/submissions             # List my submissions
GET    /api/assessor/submissions/:id         # View submission detail

# Statistics
GET    /api/assessor/statistics              # My assessment stats
```

#### Employee Endpoints
```
# View Assessment
GET    /api/employee/dashboard               # Dashboard (status)
GET    /api/employee/assessment/current      # Current period assessment
GET    /api/employee/assessment/history      # Historical assessments
GET    /api/employee/assessment/:id          # View detailed assessment

# Help & Info
GET    /api/employee/help/faq                # FAQ
GET    /api/employee/help/glossary           # Glossary
GET    /api/employee/help/guide-pdf          # Download guide PDF
```

#### Leadership Endpoints
```
# Aggregated Reports
GET    /api/leadership/dashboard             # Executive summary
GET    /api/leadership/reports/by-unit       # Report by unit
GET    /api/leadership/reports/by-value      # Report by nilai dasar
GET    /api/leadership/reports/by-culture    # Report by budaya kerja
GET    /api/leadership/reports/ranking       # Unit ranking

# Filters & Export
GET    /api/leadership/reports/:id/export    # Export report (PDF/CSV)
POST   /api/leadership/reports/schedule      # Schedule report (V3+)

# Drill-down
GET    /api/leadership/unit/:unitId/detail   # Drill-down into unit
GET    /api/leadership/value/:valueId/detail # Drill-down into value
```

### 4.4 Scoring Calculation Logic

```typescript
// Contoh implementasi di backend

interface AssessmentInput {
  nilaiBerorientasiPelayanan: 1-5;
  nilaiAkuntabel: 1-5;
  nilaiKompeten: 1-5;
  nilaiHarmonis: 1-5;
  nilaiLoyal: 1-5;
  nilaiAdaptif: 1-5;
  nilaiKolaboratif: 1-5;
}

function calculateAssessmentScores(input: AssessmentInput) {
  // Step 1: Calculate total score (sum of 7 values)
  const totalScore = Object.values(input).reduce((sum, val) => sum + val, 0);
  // Max: 35

  // Step 2: Convert to scale 120
  const scoreScale120 = (totalScore / 35) * 120;

  // Step 3: Calculate Budaya Kerja scores
  // Mapping:
  // - Eksekusi Efektif = (Akuntabel + Kompeten + Loyal) / 3 * 120 / 5
  // - Cara Kerja Baru = (Adaptif + Kolaboratif) / 2 * 120 / 5
  // - Pelayanan Unggul = (Berorientasi Pelayanan + Harmonis) / 2 * 120 / 5
  
  const budayaEksekusiEfektif = 
    ((input.nilaiAkuntabel + input.nilaiKompeten + input.nilaiLoyal) / 3) / 5 * 120;
  
  const budayaCaraKerjaBaru = 
    ((input.nilaiAdaptif + input.nilaiKolaboratif) / 2) / 5 * 120;
  
  const budayaPelayananUnggul = 
    ((input.nilaiBerorientasiPelayanan + input.nilaiHarmonis) / 2) / 5 * 120;

  return {
    totalScore,
    scoreScale120: round(scoreScale120, 2),
    budayaEksekusiEfektif: round(budayaEksekusiEfektif, 2),
    budayaCaraKerjaBaru: round(budayaCaraKerjaBaru, 2),
    budayaPelayananUnggul: round(budayaPelayananUnggul, 2),
  };
}

// Helper: Round to 2 decimals
function round(value: number, decimals: number) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
```

---

## 5. USER FLOWS & WORKFLOWS

### 5.1 Period Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ PERIOD LIFECYCLE                                        │
└─────────────────────────────────────────────────────────┘

[Draft]
  ↓ Admin creates period (e.g., Q1 2026, Jan-Mar)
  ↓ Admin uploads employee list & auto-assigns assessors
  ↓ Admin reviews assignments, makes manual overrides
  ↓
[Active]
  ↓ Notifications sent to assessors
  ↓ Assessment window opens (Jan 1 - Mar 31, 2026)
  ↓ Assessors conduct assessments
  ↓ Assessors submit (or revise) assessments
  ↓ Assessments auto-calculated (skor, budaya kerja)
  ↓ Employees notified + can view results
  ↓ Progress dashboard monitors completion
  ↓ Admin sends deadline reminders
  ↓
[Closed]
  ↓ Deadline passed (Apr 30, 2026)
  ↓ No new submissions allowed
  ↓ Admin finalizes reports
  ↓ Leadership reviews agregated reports
  ↓
[Archived]
  ↓ Data retained for historical reference
  ↓ Available for trend analysis & audit
  ↓ Searchable via audit log
```

### 5.2 Assessment Submission & Revision Flow

```
┌──────────────────────────────────────────────────────────┐
│ ASSESSMENT WORKFLOW (Per Employee)                       │
└──────────────────────────────────────────────────────────┘

INITIAL SUBMISSION:
  Assessor starts assessment form
    ↓
  Inputs skor for 7 nilai dasar
    ↓
  Adds feedback (optional)
    ↓
  System calculates scores (auto)
    ↓
  Assessor reviews preview
    ↓
  Assessor submits
    ↓
  Status: "Submitted" (current assessment record)
  Employee: Notified & can view

REVISION (If Period Still Active):
  Assessor clicks "Edit" on submitted assessment
    ↓
  Changes skor & feedback
    ↓
  System recalculates scores
    ↓
  Assessor submits revised version
    ↓
  Previous version overwritten (not retained in main view)
  History: Audit log records both versions
  Employee: Notified of revision

AFTER PERIOD CLOSED:
  No more revisions allowed
  Assessment locked
```

### 5.3 Notification Strategy

| Event | Recipient | Channel | Content |
|-------|-----------|---------|---------|
| **Period Created** | All Assessors | Email | "Anda ditugaskan menilai X pegawai untuk Q1 2026. Deadline: 30 Apr. [Klik link]" |
| **2 Weeks Before Deadline** | Pending Assessors | Email + In-App | "Reminder: X penilaian belum selesai. Deadline 2 minggu lagi." |
| **1 Week Before** | Pending Assessors | Email + In-App | "Urgent: X penilaian belum selesai. Deadline 1 minggu lagi." |
| **Assessment Submitted** | Employee | In-App Notification | "Anda sudah dinilai untuk Q1 2026. [Lihat hasil]" |
| **Period Closed** | Admin + Leadership | Email | "Penilaian Q1 2026 selesai. Report siap review. [Download]" |
| **Deadline Overdue** | Admin Dashboard | In-App Alert | "X penilaian melewati deadline. Action: Send reminder / Force close." |

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance

| Metric | Target |
|--------|--------|
| **Page Load Time** | <3s (Lighthouse score >80) |
| **API Response Time** | <500ms (p95) |
| **Database Query** | <100ms (p95) |
| **Concurrent Users** | 500+ (with 10 assessors simultaneous) |
| **Uptime** | 99.5% |

**Optimization Strategies**:
- ✅ Pagination for large lists (50 items per page)
- ✅ Caching aggregated reports (refresh every 1 hour)
- ✅ Lazy-load charts (load on viewport)
- ✅ Database indexing on frequently-queried fields (periodId, employeeId, assessorId)

### 6.2 Security

| Aspect | Requirement |
|--------|-------------|
| **Authentication** | JWT (HTTP-only cookies, 24h expiry) |
| **Authorization** | Role-based access control (RBAC) |
| **Encryption** | HTTPS only, password hashing (bcrypt) |
| **Input Validation** | Sanitize all inputs (prevent XSS, SQL injection) |
| **Audit Trail** | All changes logged (user, timestamp, changes) |
| **Data Privacy** | Assessments are confidential (not visible to unauthorized users) |
| **GDPR Compliance** | (If applicable) Right to be forgotten, data portability |

**Security Best Practices**:
- ✅ CORS properly configured (only Kemenkes domain)
- ✅ CSRF protection on all POST/PATCH/DELETE
- ✅ Rate limiting on auth endpoints (5 attempts / 15 min)
- ✅ Regular security audits & pen testing
- ✅ Dependency scanning (Snyk, Dependabot)

### 6.3 Accessibility (WCAG 2.1 AA)

- ✅ Keyboard navigation (all interactive elements)
- ✅ Screen reader support (ARIA labels)
- ✅ Color contrast (min 4.5:1)
- ✅ Font size (min 14px)
- ✅ Mobile responsive (320px - 2560px)

### 6.4 Compliance

- ✅ **PermenPANRB 6 Tahun 2022**: Scoring formula & values aligned
- ✅ **UU 20 Tahun 2023**: ASN performance management framework
- ✅ **Kemenkes Policy**: Internal branding, color scheme, terminology
- ✅ **Data Protection**: Encryption at rest & in transit, audit logs

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: MVP (Week 1-4)
**Focus**: Core features, admin + assessor + employee basic flows

**Deliverables**:
- ✅ Database schema (Drizzle + SQLite)
- ✅ Auth system (JWT)
- ✅ Admin: Period & User management
- ✅ Assessor: Assessment form & submission
- ✅ Employee: View result (read-only)
- ✅ Basic notifications (email)
- ✅ Unit-level aggregation (simple table)

**Tech Tasks**:
- Setup Elysiajs + Drizzle + SQLite
- Frontend scaffolding (React + Shadcn)
- API endpoints for core flows
- Email service (Nodemailer test)

**Test Coverage**: 70% (critical paths)

### Phase 2: Leadership & Reporting (Week 5-6)
**Focus**: Aggregated reports, leadership dashboard, advanced analytics

**Deliverables**:
- ✅ Leadership dashboard (KPI cards, trend charts)
- ✅ Agregat reports per value/culture/unit
- ✅ Export to PDF/CSV
- ✅ Advanced filtering & drill-down
- ✅ Audit log viewer

**Tech Tasks**:
- Recharts integration (radar, bar, line charts)
- PDF generation (jsPDF + html2canvas)
- Aggregation queries optimization

**Test Coverage**: 80%

### Phase 3: Polish & Hardening (Week 7-8)
**Focus**: Performance, security, UX refinement

**Deliverables**:
- ✅ Performance optimization (caching, indexing)
- ✅ Security audit & hardening
- ✅ UI/UX refinement (user testing feedback)
- ✅ Admin period overdue management
- ✅ Comprehensive help & documentation

**Tech Tasks**:
- Load testing (k6 or Artillery)
- Security scanning (OWASP)
- Performance profiling
- E2E testing (Playwright)

**Test Coverage**: 85%

### Phase 4: Deployment & Training (Week 9-10)
**Focus**: Go-live preparation, user training, documentation

**Deliverables**:
- ✅ Production deployment (Railway/Render)
- ✅ User documentation (video tutorials, guides)
- ✅ Admin training materials
- ✅ Assessor quick-start guide
- ✅ Support channel setup (email/helpdesk)

**Tech Tasks**:
- CI/CD pipeline setup
- Database backup strategy
- Monitoring & alerting (Sentry, LogRocket)
- Documentation site (Docusaurus or wiki)

---

## 8. SUCCESS METRICS

### Adoption Metrics
| Metric | Target | Timeline |
|--------|--------|----------|
| **System Usage Rate** | 80% of assessors active | Month 1 |
| **Assessment Completion Rate** | 95% by deadline | Per period |
| **User Satisfaction (NPS)** | >40 | Month 2 |
| **Help Ticket Volume** | <5/day | Month 2 |

### Business Metrics
| Metric | Target |
|--------|--------|
| **Assessment Consistency** | Std deviation <15 points (value-by-value) |
| **Trend Improvement** | Avg score >75 (skala 120) by Q3 |
| **Data Quality** | 100% of required fields filled |
| **Audit Compliance** | 100% of changes logged |

### Technical Metrics
| Metric | Target |
|--------|--------|
| **System Uptime** | 99.5% |
| **Average Response Time** | <500ms (p95) |
| **Page Load Time** | <3s |
| **Error Rate** | <0.1% |

---

## 9. APPENDICES

### A. Glossary

| Term | Definition |
|------|-----------|
| **BARS** | Behaviorally Anchored Rating Scale - Skala penilaian dengan deskripsi perilaku spesifik per level |
| **Nilai Dasar BerAKHLAK** | 7 nilai ASN: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif |
| **Budaya Kerja Kemenkes** | 3 budaya organisasi: Eksekusi Efektif, Cara Kerja Baru, Pelayanan Unggul |
| **Skala 120** | Converted scoring range (0-120) dari original BARS range (1-5) |
| **Periode Penilaian** | Assessment period (Q1-Q4, 3 bulan + 1 bulan untuk penilaian) |
| **Assessor** | Pejabat penilai (atasan langsung pegawai) |
| **Mapping** | Automatic conversion dari 7 nilai dasar ke 3 budaya kerja |

### B. BARS Level Descriptions (Quick Reference)

```
Level 1 - Kontraproduktif (Score: 0-24 on scale 120)
  → Behavior tidak sesuai nilai, kontraproduktif, perlu pembinaan intensif

Level 2 - Reaktif Minim Inisiatif (Score: 24-48 on scale 120)
  → Behavior minimal sesuai nilai, masih bergantung arahan, inisiatif rendah

Level 3 - Sesuai Standar (Score: 48-72 on scale 120)
  → Behavior konsisten sesuai nilai standar kerja, belum melampaui

Level 4 - Proaktif Tanpa Diminta (Score: 72-96 on scale 120)
  → Behavior melampaui ekspektasi dalam beberapa aspek, proaktif

Level 5 - Role Model (Score: 96-120 on scale 120)
  → Behavior menjadi teladan, role model, motor inovasi, dampak luas
```

### C. Sample Data (For Testing)

```csv
NIP,Nama,Unit,Jabatan,Email,NIP_Atasan
19870217200912001,Mohamad Arif Mujaki,Seksi Kinerja,Kepala Seksi,arif.mujaki@kemkes.go.id,19750105199203001
19800605200812002,Ani Suryani,Seksi Kinerja,Analyst,ani.suryani@kemkes.go.id,19870217200912001
19650312197803001,Budi Santoso,Bagian SDM,Kepala Bagian,budi.santoso@kemkes.go.id,19550422198503001
```

### D. FREQUENTLY ASKED QUESTIONS (FAQ)

**Q: Berapa lama data penilaian disimpan?**  
A: Selamanya (archived), dapat diakses untuk historical trend & audit.

**Q: Bisa ada multiple assessor untuk 1 pegawai?**  
A: V2 tidak (satu periode = satu assessor). V3+ akan support 360-degree review.

**Q: Pegawai bisa lihat feedback detailed atau hanya ringkasan?**  
A: Bisa lihat feedback lengkap (umpan balik perbaikan per nilai dasar + additional comment dari assessor).

**Q: Bagaimana jika assessor di-replace mid-period?**  
A: Admin bisa reassign ke assessor baru. Assessment yang sudah ada overwritten.

**Q: Apakah scoring bisa di-adjust manually?**  
A: Tidak. Scoring otomatis berdasarkan level yang dipilih (tidak ada manual input skor).

---

## 10. VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Sept 2, 2026 | Initial PRD draft (from deep-dive interview) |
| 1.0 | Sept 2, 2026 | Final PRD, ready for development |
| 2.0 | [TBD] | Post-MVP refinements (based on user feedback) |

---

**PRD End**
