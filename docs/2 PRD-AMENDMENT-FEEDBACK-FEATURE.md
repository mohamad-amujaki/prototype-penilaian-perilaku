# PRD Amendment: Detailed Feedback Feature Specification
## Penilaian Perilaku Kerja ASN Kemenkes - V2

**Document Date**: September 2, 2026  
**Amendment Date**: September 2, 2026  
**Status**: APPROVED  
**Related Section**: PRD-v2-0.md Section 3.3.3 (Assessor Module - Conduct Assessment)

---

## 1. FEEDBACK FEATURE OVERVIEW

### 1.1 Core Requirement
Setiap assessment result harus menampilkan **umpan balik (feedback) perbaikan perilaku per nilai dasar**, yang:
- ✅ **Auto-populated** dari template BARS levels (dari file Excel reference)
- ✅ **Fully editable** oleh pejabat penilai (assessor dapat customize)
- ✅ **Displayed per nilai dasar** (7 feedback blocks, satu per nilai dasar)
- ✅ **Shown to employee** di hasil penilaian (read-only untuk pegawai)
- ✅ **Persisted** dalam database untuk audit trail

### 1.2 User Flow

**Assessor Perspective**:
```
1. Select Level untuk Nilai Dasar 1 (e.g., Level 3)
   ↓
2. System auto-populates default feedback untuk Level 3
   (dari template Excel: Umpan Balik Perbaikan Perilaku Level 3)
   ↓
3. Assessor dapat:
   a) Keep feedback default (no action)
   b) Edit/customize feedback text
   c) Delete feedback (optional field)
   ↓
4. Repeat untuk Nilai Dasar 2-7
   ↓
5. Review Step: See all 7 feedbacks (auto-populated + customized)
   ↓
6. Submit assessment
```

**Employee Perspective**:
```
1. View Assessment Result
   ↓
2. See Skor per Nilai Dasar + Level
   ↓
3. See Umpan Balik per Nilai Dasar (as provided by assessor)
   ↓
4. Read feedback for development (read-only, no edit)
```

---

## 2. DETAILED FEATURE SPECIFICATION

### 2.1 Feedback Template Structure (From Excel File)

Based on file reference: `2026_09_01_V2_Konsep_Panduan_Penilaian_Perilaku_BerAKHLAK.xlsx`

**Column: Umpan Balik Perbaikan Perilaku Level 1-5**

Each Nilai Dasar has 5 feedback templates (one per BARS level):

#### Example: Berorientasi Pelayanan
| Level | Template Feedback |
|-------|-------------------|
| 1 | "Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut." |
| 2 | "Pahami kebutuhan nyata masyarakat, jangan sekadar menjalankan prosedur formal." |
| 3 | "Sudah sesuai standar; tingkatkan dengan lebih berinisiatif tanpa menunggu diminta." |
| 4 | "Pertahankan respons yang cepat dan solutif ini secara konsisten." |
| 5 | "Pertahankan dan tularkan inisiatif perbaikan layanan ini ke rekan kerja." |

#### Example: Adaptif
| Level | Template Feedback |
|-------|-------------------|
| 1 | "Bersikap terbuka terhadap perubahan sistem kerja, jangan menolaknya." |
| 2 | "Segera terapkan perubahan begitu diinformasikan, tanpa menunggu diingatkan berulang." |
| 3 | "Sudah cukup adaptif; mulai berani usulkan ide perbaikan, bukan hanya menyesuaikan diri." |
| 4 | "Pertahankan inisiatif usulan ide baru ini dan coba terapkan bertahap." |
| 5 | "Pertahankan semangat menjadi pelopor inovasi dan berbagi ke rekan kerja." |

**System responsibility**: Store semua 35 template feedbacks (7 nilai dasar × 5 levels) dalam database atau config file, accessible untuk auto-population.

---

### 2.2 Assessment Form: Enhanced Feedback Step (Step 4)

**Current State** (PRD Section 3.3.3, Step 4):
- Checkbox untuk each feedback per nilai dasar
- Additional comment field (max 500 chars)

**ENHANCED STATE** (This Amendment):

#### Step 4a: Feedback Selection & Editing Interface

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: UMPAN BALIK PERBAIKAN PERILAKU                      │
│ (Opsional - Auto-populated dari template, bisa diedit)      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ 1. BERORIENTASI PELAYANAN (Level 1)                      │
│                                                              │
│   Template Feedback (Default):                              │
│   ┌──────────────────────────────────────────────────────┐ │
│   │ "Segera tindak lanjuti setiap keluhan masyarakat    │ │
│   │  /pengguna layanan maksimal 1x24 jam, jangan        │ │
│   │  dibiarkan berlarut-larut."                         │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                              │
│   ☐ Gunakan feedback default (keep as-is)                 │
│   ☐ Edit feedback (customize narasi)                      │
│                                                              │
│   [If "Edit feedback" checked, show editable textarea]:   │
│   ┌──────────────────────────────────────────────────────┐ │
│   │ Masukan perbaikan yang disesuaikan dengan situasi    │ │
│   │ pegawai (max 300 karakter):                         │ │
│   │                                                      │ │
│   │ [Edit text field - pre-filled with default]         │ │
│   │ Char count: 156/300                                 │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                              │
│   [✓] Include this feedback for employee    [✗] Skip this   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ 2. AKUNTABEL (Level 2)                                   │
│                                                              │
│   Template Feedback (Default):                              │
│   ┌──────────────────────────────────────────────────────┐ │
│   │ "Tingkatkan ketelitian kerja dengan membiasakan     │ │
│   │  cek ulang sebelum menyerahkan hasil."              │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                              │
│   ☐ Gunakan feedback default                               │
│   ☐ Edit feedback                                          │
│   [✓] Include this feedback for employee    [✗] Skip this   │
│                                                              │
│ [... repeat untuk Nilai Dasar 3-7 ...]                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ ADDITIONAL COMMENT (For all 7 feedbacks combined):          │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Komentar tambahan/umum untuk pegawai (max 500 char): │   │
│ │                                                      │   │
│ │ [Textarea: e.g., "Secara keseluruhan, Anda sudah    │   │
│ │  menunjukkan komitmen baik. Fokus pada 3 area       │   │
│ │  pengembangan di atas untuk tahun depan."]          │   │
│ │                                                      │   │
│ │ Char count: 0/500                                   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Interaction Logic:

**For each Nilai Dasar**:

1. **Display Template Feedback** (read-only, auto-populated based on selected level):
   - Pulled from database table `feedback_templates`
   - Keyed by: (nilai_dasar_id, level_1_to_5)
   - Default state: display only, no edit input shown

2. **Checkbox: "Gunakan feedback default"** (default: CHECKED)
   - If checked: use template as-is, show in assessment
   - If unchecked: disable the checkbox (grayed out), show: "Include this feedback?" toggle

3. **Checkbox: "Edit feedback"** (default: UNCHECKED)
   - If clicked: reveal editable textarea (pre-filled with template text)
   - Textarea is rich-text or plain text (recommend plain text for simplicity)
   - Char limit: 300 characters (or customizable per requirements)
   - Real-time char counter: "123/300"
   - Save changes in-memory (not persisted until form submit)

4. **Toggle: "Include this feedback for employee"** (default: YES)
   - If toggled OFF: this feedback won't appear in employee view (skip)
   - Visual hint: "This feedback will NOT be shown to employee" (warning icon + text)
   - Useful if assessor wants to note something but not share with employee

5. **Additional Comment Field** (bottom of step):
   - Optional field for generic/cross-cutting feedback (not tied to specific nilai dasar)
   - Max 500 chars
   - Example: "Secara umum, Anda menunjukkan peningkatan..." atau "Fokus pada area X di tahun depan..."
   - This is optional; if blank, don't persist

---

### 2.3 Database Schema Updates

**New/Updated Tables**:

#### `feedback_templates` (New)
```sql
CREATE TABLE feedback_templates (
  id TEXT PRIMARY KEY,
  nilai_dasar_id TEXT NOT NULL FOREIGN KEY → nilai_dasar.id,
  level INTEGER NOT NULL (1-5),
  template_text TEXT NOT NULL (max 300 chars),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(nilai_dasar_id, level)
);

-- Example rows:
(1, "nilai_berorientasi_pelayanan", 1, "Segera tindak lanjuti setiap keluhan...")
(2, "nilai_berorientasi_pelayanan", 2, "Pahami kebutuhan nyata masyarakat...")
...
(35, "nilai_kolaboratif", 5, "Pertahankan kemampuan membangun kemitraan...")
```

#### `assessment_feedbacks` (New - stores actual feedback per assessment)
```sql
CREATE TABLE assessment_feedbacks (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL FOREIGN KEY → assessments.id,
  nilai_dasar_id TEXT NOT NULL FOREIGN KEY → nilai_dasar.id,
  level INTEGER NOT NULL (1-5),
  template_text TEXT NOT NULL (original template),
  edited_text TEXT NULLABLE (if assessor customized),
  is_edited BOOLEAN DEFAULT 0 (1 if assessor modified),
  include_for_employee BOOLEAN DEFAULT 1 (1 = show to employee),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (assessment_id, nilai_dasar_id) UNIQUE
);
```

#### `assessments` (Existing - add new fields)
```sql
ALTER TABLE assessments ADD COLUMN (
  additional_feedback TEXT NULLABLE (max 500 chars),
  feedback_submitted_at TIMESTAMP NULLABLE
);
```

---

### 2.4 Assessment Submission Logic

**Step 4a: Validate Feedback**
- ✅ Template feedbacks loaded correctly (system must load all 7 templates for selected levels)
- ✅ No character limit exceeded (edited feedback ≤ 300, additional comment ≤ 500)
- ✅ At least one feedback should be included (optional; assessor can skip all if desired)

**Step 4b: Store Feedback**
- For each Nilai Dasar:
  1. Look up template in `feedback_templates` by (nilai_dasar_id, level)
  2. If assessor edited: store both template_text (original) + edited_text (customized) in `assessment_feedbacks`
  3. If assessor kept default: store template_text only, is_edited=0
  4. Store include_for_employee flag (whether to show to employee)
- Store additional_feedback (if provided) in assessments table

**Step 4c: Persist Feedbacks**
- On assessment SUBMIT: insert all 7 feedback records into assessment_feedbacks table
- On assessment REVISE: UPDATE existing feedbacks (delete + re-insert, or upsert logic)
- Audit trail: record in assessment_history that feedbacks were added/modified

---

## 3. EMPLOYEE VIEW: DISPLAY FEEDBACK

### 3.1 Result Display (Section 3.4.3 of PRD - Enhanced)

**Current**: Shows feedback as static text  
**ENHANCED**: Shows feedback blocks per nilai dasar, with assessor notes

```
┌─────────────────────────────────────────────────────────────┐
│ HASIL PENILAIAN PERILAKU KERJA                              │
│ Pegawai: Mohamad Arif Mujaki, M.AP                          │
│ NIP: 19870217200912001                                      │
│ Periode: Q1 2026                                            │
│ Dinilai oleh: Anik Sri Handayani, M.A (25 April 2026)      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SKOR PER NILAI DASAR BERAKHLAK                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Berorientasi Pelayanan | Level 1 | Score: 24.00    │ │
│ │ 2. Akuntabel              | Level 2 | Score: 48.00    │ │
│ │ 3. Kompeten               | Level 5 | Score: 120.00   │ │
│ │ 4. Harmonis               | Level 3 | Score: 72.00    │ │
│ │ 5. Loyal                  | Level 4 | Score: 96.00    │ │
│ │ 6. Adaptif                | Level 5 | Score: 120.00   │ │
│ │ 7. Kolaboratif            | Level 4 | Score: 96.00    │ │
│ │ ─────────────────────────────────────────────────────── │
│ │ TOTAL: 24/35 | SKALA 120: 75.43                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ UMPAN BALIK PERBAIKAN PERILAKU                              │
│                                                              │
│ 1️⃣ BERORIENTASI PELAYANAN (Level 1)                        │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ "Segera tindak lanjuti setiap keluhan masyarakat/pengguna  │
│  layanan maksimal 1x24 jam, jangan dibiarkan berlarut-     │
│  larut."                                                    │
│                                                              │
│ [Icon] Assessor customized this feedback on 25 April 2026  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 2️⃣ AKUNTABEL (Level 2)                                     │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ "Tingkatkan ketelitian kerja dengan membiasakan cek ulang  │
│  sebelum menyerahkan hasil."                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 3️⃣ KOMPETEN (Level 5)                                      │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ "Pertahankan peran sebagai mentor bagi rekan kerja."       │
│                                                              │
│ [... continue untuk Nilai Dasar 4-7 ...]                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📝 CATATAN TAMBAHAN DARI PENILAI                           │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ "Secara keseluruhan, Anda menunjukkan pertumbuhan yang     │
│  baik dalam adaptasi terhadap perubahan sistem. Fokus pada │
│  peningkatan responsivitas terhadap kebutuhan klien di     │
│  tahun mendatang. Terus pertahankan semangat kolaborasi    │
│  yang telah Anda tunjukkan."                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Display Rules (Employee View)

- ✅ Show only feedback with `include_for_employee = 1` (assessor flagged to show)
- ✅ Show template feedback text (or edited_text if assessor customized)
- ✅ Show small indicator if feedback was customized (e.g., "[Assessor customized]" or edit icon)
- ✅ Show feedback in order: Nilai Dasar 1-7
- ✅ Show additional_feedback at the end (if provided)
- ✅ Feedback is READ-ONLY (employee cannot edit, download, or export individually)
- ✅ Employee can view & screenshot (if browser allows); formal PDF export controlled by admin

---

## 4. ASSESSOR REVISION WORKFLOW

### 4.1 Revising Feedback (Period Still Active)

When assessor clicks "Edit" on a submitted assessment:

1. **Load Assessment Form** with all previously selected scores + feedbacks
2. **Pre-populate Feedback Step**:
   - For each nilai dasar, show:
     - Original template (from feedback_templates)
     - Current feedback (from assessment_feedbacks):
       - If is_edited=1: show edited_text in textarea with "[Edited]" label
       - If is_edited=0: show template_text as default
     - Current include_for_employee flag
3. **Allow Changes**:
   - Assessor can modify any feedback
   - Assessor can toggle include_for_employee on/off
   - Assessor can add/modify additional_feedback
4. **On Submit Revision**:
   - Update assessment_feedbacks records (upsert, or delete + re-insert)
   - Record audit trail: "Assessment feedbacks revised by [assessor] at [timestamp]"
   - Notify employee: "Your assessment feedback has been updated"

---

## 5. DATABASE SCHEMA EXAMPLE

### 5.1 Sample Data Insertion

```sql
-- Insert feedback templates for Berorientasi Pelayanan
INSERT INTO feedback_templates (nilai_dasar_id, level, template_text) VALUES
  ('nilai_bp', 1, 'Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut.'),
  ('nilai_bp', 2, 'Pahami kebutuhan nyata masyarakat, jangan sekadar menjalankan prosedur formal.'),
  ('nilai_bp', 3, 'Sudah sesuai standar; tingkatkan dengan lebih berinisiatif tanpa menunggu diminta.'),
  ('nilai_bp', 4, 'Pertahankan respons yang cepat dan solutif ini secara konsisten.'),
  ('nilai_bp', 5, 'Pertahankan dan tularkan inisiatif perbaikan layanan ini ke rekan kerja.');

-- After assessor submits assessment for employee with Level 1 in Berorientasi Pelayanan
INSERT INTO assessment_feedbacks 
  (assessment_id, nilai_dasar_id, level, template_text, edited_text, is_edited, include_for_employee) 
VALUES
  ('assess_123', 'nilai_bp', 1, 
   'Segera tindak lanjuti setiap keluhan masyarakat/pengguna layanan maksimal 1x24 jam, jangan dibiarkan berlarut-larut.',
   'Diperlukan peningkatan signifikan dalam responsivitas. Mulai dari sekarang, pastikan setiap keluhan ditindaklanjuti dalam 24 jam maksimal.',
   1, 1);  -- is_edited=1 (assessor customized), include_for_employee=1 (show to employee)
```

---

## 6. API ENDPOINTS (UPDATED)

### 6.1 GET /api/assessor/feedback-templates/:nilaiDasarId

**Purpose**: Fetch feedback templates for a given nilai dasar (all 5 levels)

**Response**:
```json
{
  "nilaiDasarId": "nilai_bp",
  "nilaiDasarName": "Berorientasi Pelayanan",
  "templates": [
    { "level": 1, "text": "Segera tindak lanjuti..." },
    { "level": 2, "text": "Pahami kebutuhan..." },
    { "level": 3, "text": "Sudah sesuai standar..." },
    { "level": 4, "text": "Pertahankan respons..." },
    { "level": 5, "text": "Pertahankan dan tularkan..." }
  ]
}
```

### 6.2 POST /api/assessor/assessment (UPDATED)

**Request body** (updated to include feedbacks):
```json
{
  "assignmentId": "assign_1",
  "nilaiBerorientasiPelayanan": 1,
  "nilaiAkuntabel": 2,
  "nilaiKompeten": 5,
  "nilaiHarmonis": 4,
  "nilaiLoyal": 3,
  "nilaiAdaptif": 4,
  "nilaiKolaboratif": 5,
  
  "feedbacks": [
    {
      "nilaiDasarId": "nilai_bp",
      "level": 1,
      "templateText": "Segera tindak lanjuti...",
      "editedText": "Diperlukan peningkatan signifikan...",  // optional, if assessor customized
      "isEdited": true,
      "includeForEmployee": true
    },
    // ... repeat for nilai dasar 2-7
  ],
  
  "additionalFeedback": "Secara keseluruhan, Anda menunjukkan pertumbuhan baik..."  // optional
}
```

**Response**: Same as current, but includes feedbacks array in the assessment object

### 6.3 GET /api/employee/assessment/current (UPDATED)

**Response** (updated to include feedbacks):
```json
{
  "id": "assess_123",
  "period": { "id": "period_1", "name": "Q1 2026" },
  "scores": { ... },
  "calculations": { ... },
  
  "feedbacks": [
    {
      "nilaiDasarId": "nilai_bp",
      "nilaiDasarName": "Berorientasi Pelayanan",
      "level": 1,
      "feedbackText": "Diperlukan peningkatan signifikan...",  // shown text (edited or default)
      "wasCustomized": true  // optional, for display indicator
    },
    // ... repeat for all 7 nilai dasar (only those with includeForEmployee=true)
  ],
  
  "additionalFeedback": "Secara keseluruhan..."  // if exists
}
```

---

## 7. TESTING CHECKLIST

### Unit Tests
- [ ] Feedback template loading by (nilai_dasar_id, level)
- [ ] Char count validation (≤300 for feedback, ≤500 for additional)
- [ ] is_edited flag logic (true if edited_text differs from template)
- [ ] include_for_employee toggle (don't show if false in employee view)

### Integration Tests
- [ ] Full assessment submission with feedbacks
- [ ] Feedback revision (update + audit trail)
- [ ] Employee view only shows feedbacks with includeForEmployee=true
- [ ] Char counter works in real-time
- [ ] Template auto-population on form load

### E2E Tests
- [ ] Assessor: Select level → See template → Edit → Submit
- [ ] Assessor: Revise assessment → Edit feedback → Re-submit
- [ ] Employee: View result → See all 7 feedbacks (or subset if assessor skipped)
- [ ] Employee: See "Assessor customized" indicator where applicable

---

## 8. CONFIGURATION & MAINTENANCE

### 8.1 Feedback Template Management (Admin Only)

**Future Feature** (V2.1):
- Admin panel to view/edit/add feedback templates
- Export/import templates as CSV
- Versioning (track changes to templates over time)

**For V2**: Templates are hard-coded in DB seed data (from Excel file)

### 8.2 Deployment Checklist

- [ ] `feedback_templates` table created & seeded with 35 templates (7 × 5)
- [ ] `assessment_feedbacks` table created with proper indexes
- [ ] `assessments` table altered (add additional_feedback, feedback_submitted_at columns)
- [ ] API endpoints updated to handle feedbacks
- [ ] Frontend form Step 4 updated with edit interface
- [ ] Employee view updated to display feedbacks
- [ ] Tests written & passing

---

## 9. SUMMARY OF CHANGES TO PRD

### What's Different (This Amendment vs Original PRD)

| Aspect | Original PRD | Amendment |
|--------|--------------|-----------|
| **Feedback origin** | Not explicitly stated | Auto-populated from template (feedback_templates table) |
| **Feedback editability** | Mentioned but vague | Fully specified: checkbox + textarea with 300 char limit |
| **Per-nilai-dasar feedback** | Shown in example, not required | **Required**: 7 feedback blocks, one per nilai dasar |
| **Database** | No feedback_templates table | Added new table + fields in assessments |
| **API** | Not detailed for feedbacks | Detailed endpoints for feedback templates + submission |
| **Employee view** | Shows feedback, no detail | Detailed display: per nilai dasar + customization indicator + additional comment |
| **Revision workflow** | Not covered | Full revision logic: load previous feedbacks, allow re-edit |
| **Testing** | General testing checklist | Specific feedback-related test cases |

### Backward Compatibility

✅ **Fully backward compatible**: Original features still work; this amendment adds optionality (feedback is optional, can be skipped).

---

## 10. IMPLEMENTATION PRIORITY

**Must-have (V2)**:
- ✅ Auto-populated feedback per nilai dasar per level
- ✅ Editable feedback narasi (assessor can customize)
- ✅ Feedback display in employee view
- ✅ Feedback persistence in database
- ✅ Revision logic

**Nice-to-have (V2.1+)**:
- Admin feedback template management UI
- Feedback template versioning
- Feedback analytics (which feedbacks are most commonly customized)
- Feedback translation (multi-language support)

---

**Amendment Approved**: September 2, 2026  
**Status**: Ready for Development  
**Next Step**: Update PRD-v2-0.md sections 3.3.3 and 3.4.3 with details from this amendment
