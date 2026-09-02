# PRD AMENDMENT: Master Data Management & Radar Chart Visualization
## Penilaian Perilaku Kerja ASN Kemenkes - V2

**Document Date**: September 2, 2026  
**Amendment Date**: September 2, 2026  
**Status**: APPROVED  
**Related Sections**: PRD-v2-0.md Sections 2 (Data Model), 3.2 (Admin), 3.4.3 (Employee View)

---

## 1. MASTER DATA STRUCTURE ANALYSIS

### 1.1 Data Hierarchy from Excel File

Based on file: `2026_09_01_V2_Konsep_Panduan_Penilaian_Perilaku_BerAKHLAK.xlsx`

```
PERILAKU KERJA (Performance Behaviors)
│
├── 1. BERORIENTASI PELAYANAN
│   ├─ Panduan Perilaku 1: Memahami dan memenuhi kebutuhan masyarakat
│   ├─ Panduan Perilaku 2: Ramah, cekatan, solutif, dan dapat diandalkan
│   └─ Panduan Perilaku 3: Melakukan perbaikan tiada henti
│
├── 2. AKUNTABEL
│   ├─ Panduan Perilaku 1: Melaksanakan tugas dengan jujur, bertanggung jawab...
│   ├─ Panduan Perilaku 2: Menggunakan kekayaan dan barang milik negara...
│   └─ Panduan Perilaku 3: Tidak menyalahgunakan kewenangan jabatan
│
├── 3. KOMPETEN
│   ├─ Panduan Perilaku 1: Meningkatkan kompetensi diri...
│   ├─ Panduan Perilaku 2: Membantu orang lain belajar
│   └─ Panduan Perilaku 3: Melaksanakan tugas dengan kualitas terbaik
│
├── 4. HARMONIS
│   ├─ Panduan Perilaku 1: Menghargai setiap orang apapun latar belakangnya
│   ├─ Panduan Perilaku 2: Suka menolong orang lain
│   └─ Panduan Perilaku 3: Membangun lingkungan kerja yang kondusif
│
├── 5. LOYAL
│   ├─ Panduan Perilaku 1: Memegang teguh ideologi Pancasila...
│   ├─ Panduan Perilaku 2: Menjaga nama baik sesama ASN, Pimpinan...
│   └─ Panduan Perilaku 3: Menjaga rahasia jabatan dan negara
│
├── 6. ADAPTIF
│   ├─ Panduan Perilaku 1: Cepat menyesuaikan diri menghadapi perubahan
│   ├─ Panduan Perilaku 2: Terus berinovasi dan mengembangkan kreativitas
│   └─ Panduan Perilaku 3: Bertindak proaktif
│
└── 7. KOLABORATIF
    ├─ Panduan Perilaku 1: Memberi kesempatan kepada berbagai pihak...
    ├─ Panduan Perilaku 2: Terbuka dalam bekerja sama untuk menghasilkan...
    └─ Panduan Perilaku 3: Menggerakkan pemanfaatan berbagai sumberdaya...

PLUS:

UMPAN BALIK PERBAIKAN PERILAKU (Feedback per Nilai Dasar)
│
└── For each Nilai Dasar (7 total):
    ├─ Level 1 Feedback: "Segera tindak lanjuti..."
    ├─ Level 2 Feedback: "Pahami kebutuhan..."
    ├─ Level 3 Feedback: "Sudah sesuai standar..."
    ├─ Level 4 Feedback: "Pertahankan respons..."
    └─ Level 5 Feedback: "Pertahankan dan tularkan..."

TOTAL: 7 × 5 = 35 Feedback Templates
```

---

## 2. MASTER DATA TABLES (DETAILED)

### 2.1 Database Schema for Master Data

#### Table: `nilai_dasar` (7 Core Values)

```sql
CREATE TABLE nilai_dasar (
  id TEXT PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,  -- "BP", "AK", "KP", etc.
  name VARCHAR(100) NOT NULL,  -- "Berorientasi Pelayanan"
  description TEXT,  -- Full definition
  created_by TEXT FOREIGN KEY → users.id,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- Seed data:
INSERT INTO nilai_dasar (id, code, name, description) VALUES
  ('nilai_bp', 'BP', 'Berorientasi Pelayanan', 
   'Siap melayani masyarakat dengan sepenuh hati, ramah, cekatan, solutif, dan dapat diandalkan'),
  ('nilai_ak', 'AK', 'Akuntabel', 
   'Melaksanakan tugas dengan penuh rasa tanggung jawab'),
  ('nilai_kp', 'KP', 'Kompeten', 
   'Terus meningkatkan kompetensi untuk memberikan layanan terbaik'),
  ('nilai_hm', 'HM', 'Harmonis', 
   'Menciptakan lingkungan kerja yang dinamis, kolaboratif, dan bersahabat'),
  ('nilai_ly', 'LY', 'Loyal', 
   'Berdedikasi dan setia kepada Negara Kesatuan Republik Indonesia'),
  ('nilai_ad', 'AD', 'Adaptif', 
   'Terus berinovasi dan mengembangkan kreativitas'),
  ('nilai_kb', 'KB', 'Kolaboratif', 
   'Membangun kemitraan yang kokoh untuk tujuan bersama');
```

#### Table: `panduan_perilaku` (21 Behavioral Guidelines - 3 per Nilai Dasar)

```sql
CREATE TABLE panduan_perilaku (
  id TEXT PRIMARY KEY,
  nilai_dasar_id TEXT NOT NULL FOREIGN KEY → nilai_dasar.id,
  sequence_number INTEGER NOT NULL (1-3),  -- 1st, 2nd, or 3rd panduan
  title VARCHAR(150) NOT NULL,  -- Title of the behavioral guideline
  description TEXT NOT NULL,  -- Full description
  created_by TEXT FOREIGN KEY → users.id,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  
  UNIQUE(nilai_dasar_id, sequence_number)
);

-- Seed data example:
INSERT INTO panduan_perilaku (nilai_dasar_id, sequence_number, title, description) VALUES
  ('nilai_bp', 1, 
   'Memahami dan memenuhi kebutuhan masyarakat',
   'Berusaha memahami kebutuhan nyata masyarakat/pengguna layanan dan memberikan solusi terbaik'),
  ('nilai_bp', 2,
   'Ramah, cekatan, solutif, dan dapat diandalkan',
   'Memberikan layanan dengan sikap ramah dan sikap yang dapat membuat masyarakat nyaman'),
  ('nilai_bp', 3,
   'Melakukan perbaikan tiada henti',
   'Selalu mencari cara untuk meningkatkan kualitas layanan');
  
  -- ... repeat for nilai_dasar 2-7 (21 total entries)
```

#### Table: `bars_level` (BARS Levels with Descriptions)

```sql
CREATE TABLE bars_level (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL (1-5),  -- BARS level 1-5
  level_name VARCHAR(50) NOT NULL,  -- "Kontraproduktif", "Reaktif", etc.
  description TEXT NOT NULL,  -- Description of this level
  created_by TEXT FOREIGN KEY → users.id,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(level)
);

-- Seed data:
INSERT INTO bars_level (id, level, level_name, description) VALUES
  ('bars_1', 1, 'Kontraproduktif', 
   'Perilaku merugikan organisasi, tidak sesuai nilai'),
  ('bars_2', 2, 'Reaktif Minim Inisiatif', 
   'Melakukan tugas dasar dengan minim inisiatif'),
  ('bars_3', 3, 'Sesuai Standar', 
   'Memenuhi standar kinerja yang diharapkan'),
  ('bars_4', 4, 'Proaktif Tanpa Diminta', 
   'Menunjukkan inisiatif melampaui ekspektasi'),
  ('bars_5', 5, 'Role Model', 
   'Menjadi teladan bagi organisasi, dampak luas');
```

#### Table: `feedback_template` (35 Feedback Templates - Updated)

```sql
CREATE TABLE feedback_template (
  id TEXT PRIMARY KEY,
  nilai_dasar_id TEXT NOT NULL FOREIGN KEY → nilai_dasar.id,
  bars_level INTEGER NOT NULL (1-5),
  feedback_text TEXT NOT NULL (max 300 chars),
  created_by TEXT FOREIGN KEY → users.id,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  
  FOREIGN KEY (nilai_dasar_id, bars_level) UNIQUE
);

-- Seed data:
INSERT INTO feedback_template (nilai_dasar_id, bars_level, feedback_text) VALUES
  ('nilai_bp', 1, 'Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut.'),
  ('nilai_bp', 2, 'Pahami kebutuhan nyata masyarakat, jangan sekadar menjalankan prosedur formal.'),
  ('nilai_bp', 3, 'Sudah sesuai standar; tingkatkan dengan lebih berinisiatif tanpa menunggu diminta.'),
  ('nilai_bp', 4, 'Pertahankan respons yang cepat dan solutif ini secara konsisten.'),
  ('nilai_bp', 5, 'Pertahankan dan tularkan inisiatif perbaikan layanan ini ke rekan kerja.');
  
  -- ... repeat for nilai_dasar 2-7 (35 total entries)
```

### 2.2 Data Relationships (ERD)

```
┌──────────────────┐
│   nilai_dasar    │
│ (7 core values)  │
│  id, code, name  │
└────────┬─────────┘
         │ 1:3
         ▼
┌──────────────────────────┐
│   panduan_perilaku       │
│ (21 guidelines)          │
│  id, nilai_dasar_id, ... │
└──────────────────────────┘

┌──────────────────┐
│   bars_level     │
│ (5 BARS levels)  │
│  id, level, name │
└────────┬─────────┘
         │ M:N
         ▼
┌──────────────────────────┐
│  feedback_template       │
│ (35 feedback templates)  │
│  id, nilai_dasar_id,     │
│  bars_level, feedback... │
└──────────────────────────┘
```

---

## 3. ADMIN INTERFACE FOR MASTER DATA MANAGEMENT

### 3.1 New Admin Module: "Master Data Management"

**Navigation Path**: Admin Dashboard → Settings → Master Data Management

```
Master Data Management
├── Nilai Dasar (7 items)
│   ├── List View (table: ID, Code, Name, Status, Actions)
│   ├── Create New (form: Code, Name, Description)
│   ├── Edit (form: pre-filled)
│   ├── Delete (soft delete: set is_active=0)
│   └── View History (audit trail: who created/edited when)
│
├── Panduan Perilaku (21 items)
│   ├── Filter by Nilai Dasar (dropdown)
│   ├── List View (table: Nilai Dasar, Sequence, Title, Status)
│   ├── Create New (form: select Nilai Dasar, enter Title + Description)
│   ├── Edit (form: pre-filled)
│   ├── Delete (soft delete)
│   └── Reorder (drag-drop to change sequence 1-3)
│
├── BARS Level (5 items - mostly view-only)
│   ├── List View (table: Level, Name, Description)
│   ├── Edit (form: Name + Description editable, Level fixed)
│   └── View History
│
└── Feedback Templates (35 items)
    ├── Filter by Nilai Dasar (dropdown)
    ├── List View (table: Nilai Dasar, BARS Level, Feedback Text)
    ├── Create New (form: select Nilai Dasar + Level, enter Feedback)
    ├── Edit (form: pre-filled)
    ├── Delete (soft delete)
    └── Preview (show how feedback appears to users)
```

### 3.2 Admin Features: Edit Master Data

#### Feature: Edit Nilai Dasar

```
┌─────────────────────────────────────────────────────┐
│ EDIT NILAI DASAR                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ID: nilai_bp (read-only)                           │
│ Code: BP (max 3 chars)                              │
│ Name: Berorientasi Pelayanan (max 100 chars)       │
│                                                     │
│ Description:                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │ Siap melayani masyarakat dengan sepenuh    │   │
│ │ hati, ramah, cekatan, solutif, dan dapat   │   │
│ │ diandalkan                                  │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Status: ☑ Active                                   │
│                                                     │
│ [Cancel] [Save] [Delete]                          │
│                                                     │
│ Last updated: 2026-08-15 by Anik Sri Handayani    │
└─────────────────────────────────────────────────────┘
```

#### Feature: Edit Panduan Perilaku

```
┌──────────────────────────────────────────────────────┐
│ EDIT PANDUAN PERILAKU                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Nilai Dasar: Berorientasi Pelayanan (read-only)    │
│ Sequence: 1 (read-only)                             │
│                                                      │
│ Title: Memahami dan memenuhi kebutuhan masyarakat  │
│ (max 150 chars)                                     │
│                                                      │
│ Description:                                        │
│ ┌──────────────────────────────────────────────┐   │
│ │ Berusaha memahami kebutuhan nyata masyarakat │   │
│ │ /pengguna layanan dan memberikan solusi      │   │
│ │ terbaik                                       │   │
│ │                                               │   │
│ │ Char count: 98/500                           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Status: ☑ Active                                    │
│                                                      │
│ [Cancel] [Save] [Delete]                           │
│                                                      │
│ Last updated: 2026-08-10 by Anik Sri Handayani    │
└──────────────────────────────────────────────────────┘
```

#### Feature: Edit Feedback Template

```
┌──────────────────────────────────────────────────────┐
│ EDIT FEEDBACK TEMPLATE                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Nilai Dasar: Berorientasi Pelayanan (read-only)    │
│ BARS Level: 1 - Kontraproduktif (read-only)        │
│                                                      │
│ Feedback Text:                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Segera tindak lanjuti setiap keluhan        │   │
│ │ masyarakat/pengguna layanan maksimal 1x24   │   │
│ │ jam, jangan dibiarkan berlarut-larut.       │   │
│ │                                              │   │
│ │ Char count: 107/300                         │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Preview for Assessor:                              │
│ ┌──────────────────────────────────────────────┐   │
│ │ Template preview shown here (read-only)      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Status: ☑ Active                                    │
│                                                      │
│ [Cancel] [Save] [Delete]                           │
│                                                      │
│ Last updated: 2026-08-15 by Anik Sri Handayani    │
└──────────────────────────────────────────────────────┘
```

### 3.3 Audit Trail & Change Log

All master data changes logged:

```sql
CREATE TABLE master_data_audit (
  id TEXT PRIMARY KEY,
  table_name VARCHAR(50),  -- 'nilai_dasar', 'panduan_perilaku', etc.
  record_id TEXT,
  action VARCHAR(10),  -- 'create', 'update', 'delete'
  changed_fields JSON,  -- {field: old→new}
  changed_by TEXT FOREIGN KEY → users.id,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Admin can view change history:
```
NILAI DASAR: Berorientasi Pelayanan
├── 2026-08-15 14:30 - Updated Description by Anik Sri
├── 2026-08-10 09:15 - Created by Mohamad Arif
└── [View Full Diff]
```

---

## 4. RADAR CHART VISUALIZATION (Sheet 3 from Excel)

### 4.1 Radar Chart Concept from Excel

File shows 3 axes:
- **EKSEKUSI EFEKTIF** (Execution Excellence)
- **CARA KERJA BARU** (New Way of Working)
- **PELAYANAN UNGGUL** (Service Excellence)

Based on Nilai Dasar mapping:
- **Eksekusi Efektif** = (Akuntabel + Kompeten + Loyal) ÷ 3
- **Cara Kerja Baru** = (Adaptif + Kolaboratif) ÷ 2
- **Pelayanan Unggul** = (Berorientasi Pelayanan + Harmonis) ÷ 2

### 4.2 Radar Chart Implementation

#### Data Calculation

```typescript
interface RadarChartData {
  eksekusiEfektif: number;    // 0-120
  caraKerjaBaru: number;       // 0-120
  pelayananUnggul: number;     // 0-120
}

function calculateRadarData(assessment: Assessment): RadarChartData {
  // Extract individual scores
  const akuntabel = assessment.nilaiAkuntabel;
  const kompeten = assessment.nilaiKompeten;
  const loyal = assessment.nilaiLoyal;
  const adaptif = assessment.nilaiAdaptif;
  const kolaboratif = assessment.nilaiKolaboratif;
  const berorientasi = assessment.nilaiBerorientasiPelayanan;
  const harmonis = assessment.nilaiHarmonis;

  // Calculate budaya kerja averages (on scale 0-5)
  const eksekusiEfektif = ((akuntabel + kompeten + loyal) / 3 / 5) * 120;
  const caraKerjaBaru = ((adaptif + kolaboratif) / 2 / 5) * 120;
  const pelayananUnggul = ((berorientasi + harmonis) / 2 / 5) * 120;

  return {
    eksekusiEfektif: Math.round(eksekusiEfektif * 100) / 100,
    caraKerjaBaru: Math.round(caraKerjaBaru * 100) / 100,
    pelayananUnggul: Math.round(pelayananUnggul * 100) / 100
  };
}
```

#### Visual Rendering (Recharts Radar Chart)

```typescript
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';

function BudayaKerjaRadarChart({ assessment }: Props) {
  const radarData = calculateRadarData(assessment);
  
  const data = [
    {
      name: 'Eksekusi Efektif',
      value: radarData.eksekusiEfektif,
      max: 120
    },
    {
      name: 'Cara Kerja Baru',
      value: radarData.caraKerjaBaru,
      max: 120
    },
    {
      name: 'Pelayanan Unggul',
      value: radarData.pelayananUnggul,
      max: 120
    }
  ];

  return (
    <div className="radar-chart-container">
      <h3>Profil Budaya Kerja Kemenkes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <Radar 
            name="Skor (Skala 120)" 
            dataKey="value" 
            stroke="#185FA5" 
            fill="#185FA5" 
            fillOpacity={0.6} 
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Summary table below radar */}
      <table className="summary-table">
        <thead>
          <tr>
            <th>Budaya Kerja</th>
            <th>Skor 120</th>
            <th>Kategori</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Eksekusi Efektif</td>
            <td>{radarData.eksekusiEfektif}</td>
            <td>{getCategory(radarData.eksekusiEfektif)}</td>
          </tr>
          <tr>
            <td>Cara Kerja Baru</td>
            <td>{radarData.caraKerjaBaru}</td>
            <td>{getCategory(radarData.caraKerjaBaru)}</td>
          </tr>
          <tr>
            <td>Pelayanan Unggul</td>
            <td>{radarData.pelayananUnggul}</td>
            <td>{getCategory(radarData.pelayananUnggul)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Category mapping: score ranges map to performance categories
function getCategory(score: number): string {
  if (score < 40) return 'Sangat Kurang';
  if (score < 65) return 'Kurang';
  if (score < 80) return 'Cukup';
  if (score < 90) return 'Baik';
  return 'Sangat Baik';
}
```

### 4.3 Radar Chart Display Locations

#### Location 1: Employee Result View (Section 3.4.3)

```
HASIL PENILAIAN PERILAKU KERJA
[Scores Table]

PROFIL BUDAYA KERJA KEMENKES
┌─────────────────────────────────────────┐
│        Radar Chart (3-axis)             │
│   Eksekusi Efektif                      │
│   Cara Kerja Baru                       │
│   Pelayanan Unggul                      │
│   (with values on each axis)            │
└─────────────────────────────────────────┘

Summary Table:
├─ Eksekusi Efektif: 72 (Kurang)
├─ Cara Kerja Baru: 108 (Baik)
└─ Pelayanan Unggul: 48 (Sangat Kurang)
```

#### Location 2: Leadership Dashboard (Section 3.5.2)

```
EXECUTIVE DASHBOARD
[KPI Cards]

Budaya Kerja Rata-Rata (Current Period)
┌─────────────────────────────────────────┐
│     Radar Chart (Organizational Level)  │
│   Eksekusi Efektif: 74.3                │
│   Cara Kerja Baru: 81.5                 │
│   Pelayanan Unggul: 62.1                │
└─────────────────────────────────────────┘

By Unit Comparison:
├─ Seksi Kinerja: [Radar]
├─ Bagian SDM: [Radar]
└─ UPT Regional: [Radar]
```

#### Location 3: Leadership Detailed Report (Section 3.5.5)

```
BUDAYA KERJA REPORT
┌─────────────────────────────────────────┐
│  Eksekusi Efektif (74.3)                │
│  [Radar showing position on scale]      │
│  Status: Kurang (target: >80)           │
│  Trend: Q4 73.8 → Q1 74.3 (↑)          │
└─────────────────────────────────────────┘

[Similarly for Cara Kerja Baru & Pelayanan Unggul]
```

### 4.4 Comparison Visualization

Show multiple employees' radar charts side-by-side (for leadership):

```
Unit Comparison - Radar Charts
┌──────────────┬──────────────┬──────────────┐
│  Emp. A      │  Emp. B      │  Emp. C      │
│   [Radar]    │   [Radar]    │   [Radar]    │
│  Avg: 75.4   │  Avg: 82.1   │  Avg: 68.5   │
└──────────────┴──────────────┴──────────────┘
```

---

## 5. DATABASE SCHEMA UPDATES (SUMMARY)

### New Tables

```sql
-- Master Data Tables
CREATE TABLE nilai_dasar (id, code, name, description, ...);
CREATE TABLE panduan_perilaku (id, nilai_dasar_id, sequence, title, description, ...);
CREATE TABLE bars_level (id, level, level_name, description, ...);
CREATE TABLE feedback_template (id, nilai_dasar_id, bars_level, feedback_text, ...);
CREATE TABLE master_data_audit (id, table_name, record_id, action, changed_fields, ...);
```

### Updated Tables

```sql
-- Already included in previous amendment
CREATE TABLE assessment_feedbacks (...);
ALTER TABLE assessments ADD additional_feedback, feedback_submitted_at;
```

---

## 6. API ENDPOINTS (ADMIN MASTER DATA)

### New Endpoints for Admin Management

#### GET /api/admin/master-data/nilai-dasar
Returns all 7 nilai dasar

**Response**:
```json
{
  "data": [
    { "id": "nilai_bp", "code": "BP", "name": "Berorientasi Pelayanan", "description": "..." },
    { "id": "nilai_ak", "code": "AK", "name": "Akuntabel", "description": "..." },
    ...
  ]
}
```

#### POST /api/admin/master-data/nilai-dasar
Create new nilai dasar

#### PATCH /api/admin/master-data/nilai-dasar/:id
Update nilai dasar

#### GET /api/admin/master-data/panduan-perilaku
Returns all 21 panduan perilaku (with optional filter by nilai_dasar_id)

#### POST /api/admin/master-data/panduan-perilaku
Create new panduan perilaku

#### PATCH /api/admin/master-data/panduan-perilaku/:id
Update panduan perilaku

#### GET /api/admin/master-data/feedback-templates
Returns all 35 feedback templates (with optional filter)

#### POST /api/admin/master-data/feedback-templates
Create new feedback template

#### PATCH /api/admin/master-data/feedback-templates/:id
Update feedback template

#### GET /api/admin/master-data/audit-log
Returns audit trail of all master data changes

---

## 7. TESTING CHECKLIST

### Unit Tests
- [ ] Radar chart data calculation (3 budaya kerja from 7 nilai dasar)
- [ ] Category mapping (score range to performance level)
- [ ] Master data queries (load nilai_dasar, panduan_perilaku, feedback_template)
- [ ] Soft delete logic (is_active flag)

### Integration Tests
- [ ] Admin can CRUD nilai_dasar
- [ ] Admin can CRUD panduan_perilaku (with sequence validation)
- [ ] Admin can CRUD feedback_template
- [ ] Audit trail logs all changes
- [ ] Feedback templates auto-load in assessment form
- [ ] Radar chart displays correctly with multiple assessment scores

### E2E Tests
- [ ] Admin: Edit nilai_dasar → Save → Verify in database
- [ ] Admin: Edit feedback template → Assessor form auto-loads new text
- [ ] Employee: View assessment → Radar chart renders correctly
- [ ] Leadership: View unit comparison → Multiple radars display side-by-side

---

## 8. DEPLOYMENT CHECKLIST

- [ ] Create nilai_dasar table & seed 7 values
- [ ] Create panduan_perilaku table & seed 21 guidelines
- [ ] Create bars_level table & seed 5 levels
- [ ] Create feedback_template table & seed 35 templates
- [ ] Create master_data_audit table
- [ ] Add master data admin pages to UI
- [ ] Add CRUD API endpoints
- [ ] Add Recharts radar chart component
- [ ] Integrate radar chart into employee view
- [ ] Integrate radar chart into leadership dashboard
- [ ] All tests passing

---

## 9. IMPLEMENTATION PRIORITY

### Must-Have (V2 - Required)
✓ Master data tables (7 + 21 + 35 values)
✓ Admin CRUD interface for master data
✓ Radar chart visualization (3 axes)
✓ Radar chart in employee result view
✓ Radar chart in leadership dashboard
✓ Audit trail for changes

### Nice-to-Have (V2.1+)
○ Master data versioning (history of changes)
○ Bulk import/export master data (CSV)
○ Template preview before saving
○ Master data translation (multi-language)

---

## 10. SUMMARY OF CHANGES

### What's Different (This Amendment vs Previous PRD)

| Aspect | Previous | Amendment |
|--------|----------|-----------|
| **Nilai Dasar** | Mentioned, not structured | Dedicated table + admin CRUD |
| **Panduan Perilaku** | Not explicitly structured | Dedicated table (21 entries) + admin CRUD |
| **BARS Levels** | Only descriptions in feedback | Dedicated table + descriptions |
| **Feedback Templates** | In previous amendment | Linked to BARS levels via tables |
| **Admin Interface** | No master data management | Full admin module for CRUD |
| **Radar Chart** | Mentioned in mockup | Full implementation spec + locations |
| **Data Management** | Static (from Excel seed) | Dynamic (admin can edit anytime) |
| **Audit Trail** | For assessments only | For all master data changes too |

---

**Amendment Approved**: September 2, 2026  
**Status**: Ready for Development  
**Next Step**: Add these tables to database migration + update admin module spec
