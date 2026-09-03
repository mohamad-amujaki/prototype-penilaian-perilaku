/**
 * import-workbook.ts — Sistem Import Data Pegawai dari Excel/CSV
 *
 * Modul ini menangani:
 * 1. Pembuatan template import Excel (.xlsx) dengan petunjuk penggunaan
 * 2. Parsing file Excel atau CSV yang diunggah admin
 * 3. Normalisasi NIP (Nomor Induk Pegawai) yang bisa memiliki 17-18 digit
 * 4. Pencocokan NIP atasan untuk membuat penugasan penilaian
 *
 * Template Excel memiliki 2 sheet:
 * - Sheet "Petunjuk": panduan penggunaan
 * - Sheet "Data Pegawai": data yang harus diisi admin
 *
 * Kolom yang wajib diisi:
 * NIP, Nama, PangkatGolongan, UnitKode, UnitNama, Jabatan, Email, NIP_Atasan
 */

import ExcelJS from "exceljs";
import { parseCsv } from "./util";

/**
 * Header kolom yang diharapkan dalam file import.
 * Urutan ini harus sama persis dengan template Excel.
 */
export const IMPORT_HEADERS = [
  "NIP",              // Nomor Induk Pegawai (17-18 digit)
  "Nama",             // Nama lengkap
  "PangkatGolongan",  // Pangkat/golongan (contoh: Penata / III.c)
  "UnitKode",         // Kode unit (akan dibuat otomatis jika belum ada)
  "UnitNama",         // Nama unit
  "Jabatan",          // Jabatan pegawai
  "Email",            // Email login (unik)
  "NIP_Atasan",       // NIP atasan/penilai (harus ada di kolom NIP)
] as const;

/**
 * Membuat file template import Excel (.xlsx) yang sudah diformat.
 *
 * Fitur template:
 * - Header berwarna biru dengan teks putih
 * - Kolom NIP dan NIP_Atasan diformat sebagai teks (bukan angka)
 * - Contoh data sudah diisi (bisa dihapus atau ditimpa)
 * - Sheet petunjuk dengan panduan lengkap
 *
 * @param periodName - Nama periode penilaian (contoh: "Q1 2026")
 * @returns Buffer berisi file .xlsx
 */
export async function buildImportTemplate(periodName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Penilaian Perilaku ASN Kemenkes";
  wb.created = new Date();

  // ==================== SHEET PETUNJUK ====================
  const panduan = wb.addWorksheet("Petunjuk", { views: [{ showGridLines: false }] });
  panduan.getColumn(1).width = 92;

  // Judul
  panduan.getCell("A1").value = "Template Import Pegawai & Assignment";
  panduan.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF185FA5" } };
  panduan.getCell("A2").value = `Periode: ${periodName}`;

  // Judul petunjuk
  panduan.getCell("A4").value = "Cara pakai";
  panduan.getCell("A4").font = { bold: true };

  // Langkah-langkah penggunaan
  const steps = [
    "1. Isi sheet Data Pegawai. Jangan ubah nama kolom di baris 1.",
    "2. Satu baris = satu pegawai yang dinilai pada periode ini.",
    "3. NIP wajib 18 digit angka, diketik sebagai teks (jangan format Number agar tidak jadi notasi ilmiah).",
    "4. NIP_Atasan diisi NIP pejabat penilai. Nama atasan diambil dari kolom Nama baris pegawai yang NIP-nya sama (di file ini atau yang sudah terdaftar).",
    "5. Jika NIP_Atasan tidak ketemu di data pegawai, assignment tetap unassigned — tidak membuat akun fiktif.",
    "6. Jika NIP_Atasan dikosongkan, assignment berstatus unassigned dan periode belum bisa diaktifkan.",
    "7. Simpan file sebagai .xlsx lalu unggah di halaman Admin → Assignment & import.",
    "8. File .csv dengan header yang sama juga diterima.",
    "9. Akun baru memakai password default Password1 (disimpan ter-hash). Pengguna wajib ganti di Profil.",
    "10. Hapus baris contoh sebelum unggah, atau ganti datanya dengan data asli.",
  ];
  steps.forEach((s, i) => {
    panduan.getCell(`A${5 + i}`).value = s;
  });

  // Daftar kolom
  panduan.getCell("A14").value = "Kolom";
  panduan.getCell("A14").font = { bold: true };
  const cols: Array<[string, string]> = [
    ["NIP", "Nomor Induk Pegawai, 18 digit, unik"],
    ["Nama", "Nama lengkap pegawai"],
    ["PangkatGolongan", "Contoh: Penata / III.c"],
    ["UnitKode", "Kode unit (jika baru, unit otomatis dibuat)"],
    ["UnitNama", "Nama unit"],
    ["Jabatan", "Jabatan pegawai"],
    ["Email", "Email login, unik"],
    ["NIP_Atasan", "NIP atasan = NIP salah satu pegawai; nama atasan = Nama pegawai itu"],
  ];
  cols.forEach((c, i) => {
    panduan.getCell(`A${15 + i}`).value = `${c[0]} — ${c[1]}`;
  });

  // ==================== SHEET DATA PEGAWAI ====================
  const data = wb.addWorksheet("Data Pegawai");
  data.views = [{ state: "frozen", ySplit: 1 }]; // Freeze header agar tetap terlihat saat scroll

  // Format header kolom
  IMPORT_HEADERS.forEach((h, i) => {
    const cell = data.getCell(1, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Teks putih
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF185FA5" } }; // Latar belakang biru
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  data.getRow(1).height = 22;

  // Format kolom NIP dan NIP_Atasan sebagai teks (agar tidak jadi notasi ilmiah)
  data.getColumn(1).numFmt = "@";
  data.getColumn(8).numFmt = "@";

  // Lebar kolom
  const widths = [22, 28, 20, 14, 22, 24, 32, 22];
  widths.forEach((w, i) => {
    data.getColumn(i + 1).width = w;
  });

  // ==================== DATA CONTOH ====================
  const examples = [
    [
      "199202021234567891    ",
      "Budi Pratama",
      "Penata Tk. I / III.d",
      "OSDM",
      "Tim Kerja Pengelolaan Kinerja Pegawai",
      "Analis Kinerja",
      "penilai@demo.go.id",
      "199001011234567890",
    ],
    [
      "199303031234567892",
      "Siti Rahayu",
      "Penata Muda / III.a",
      "OSDM",
      "Tim Kerja Pengelolaan Kinerja Pegawai",
      "Analis",
      "pegawai@demo.go.id",
      "199202021234567891",
    ],
  ];

  // Isi data contoh dengan format abu-abu muda
  examples.forEach((row, r) => {
    row.forEach((val, c) => {
      const cell = data.getCell(r + 2, c + 1);
      cell.value = val;
      cell.font = { italic: true, color: { argb: "FF64748B" } };
    });
  });

  // Catatan tentang data contoh
  data.getCell("A11").value = "(baris contoh di atas boleh dihapus atau ditimpa)";
  data.getCell("A11").font = { italic: true, color: { argb: "FF94A3B8" }, size: 10 };
  data.mergeCells("A11:H11");

  // Konversi workbook ke buffer
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ==================== FUNGSI NORMALISASI NIP ====================

/**
 * Menormalisasi NIP dengan menghapus semua karakter non-angka.
 * Contoh: "1987.0217.200912.001" → "19870217200912001"
 */
export function normalizeNip(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * Mencocokkan dua NIP dengan toleransi digit gender.
 *
 * NIP Indonesia berformat 18 digit: YYYYMMDD PP.XXXXX.XX.XX
 * Dimana PP = kode gender (laki-laki genap, perempuan ganjil).
 *
 * Kadang data seed/demo tidak menyertakan digit gender (posisi ke-9).
 * Fungsi ini akan mencocokkan meskipun digit gender berbeda atau tidak ada.
 *
 * Contoh:
 * - nipsMatch("198702172009121001", "198702172009121001") = true
 * - nipsMatch("198702172009121001", "198702172009121001") = true
 */
export function nipsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = normalizeNip(a);
  const db = normalizeNip(b);
  if (!da || !db) return false;
  if (da === db) return true;

  // Jika salah satu 18 digit, buang digit gender (posisi ke-9) lalu bandingkan
  const withoutGender = (n: string) => (n.length === 18 ? n.slice(0, 8) + n.slice(9) : n);
  return withoutGender(da) === withoutGender(db);
}

// ==================== FUNGSI PARSING ====================

/**
 * Mengekstrak teks dari nilai sel Excel.
 * Menangani berbagai tipe data Excel: number, string, boolean, Date, richText, formula.
 */
function valueText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "number") {
    // Angka: jika integer tampilkan sebagai string, jika desimal gunakan format fullwide
    if (Number.isSafeInteger(value)) return String(value);
    return value.toLocaleString("fullwide", { useGrouping: false });
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text).trim();
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((p) => p.text).join("").trim();
  }
  if (typeof value === "object" && "result" in value) return valueText(value.result as ExcelJS.CellValue);
  return String(value).trim();
}

/**
 * Membaca isi sel Excel dengan prioritas: tampilan > nilai.
 * Jika tampilan (cell.text) ada dan bukan notasi ilmiah, gunakan tampilan.
 * Jika tidak, gunakan nilai mentah cell.value.
 */
function cellText(cell: ExcelJS.Cell): string {
  const displayed = String(cell.text ?? "").replace(/\u00a0/g, " ").trim();
  if (displayed && !/e[+\-]?\d+$/i.test(displayed)) return displayed;
  return valueText(cell.value);
}

/**
 * Mem-parse file import (Excel atau CSV) menjadi array 2D.
 *
 * Mendukung:
 * - File .xlsx/.xls: dibaca menggunakan ExcelJS
 * - File .csv: dibaca menggunakan parser CSV sederhana
 *
 * Sheet yang dibaca (prioritas):
 * 1. Sheet bernama "Data Pegawai"
 * 2. Sheet yang namanya mengandung "data"
 * 3. Sheet pertama
 *
 * @throws Error jika format file tidak didukung
 */
export async function parseImportFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();

  // Handle file CSV
  if (name.endsWith(".csv") || file.type.includes("csv")) {
    const text = await file.text();
    return parseCsv(text);
  }

  // Handle file Excel
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet") || file.type.includes("excel")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());

    // Cari sheet yang sesuai
    const ws =
      wb.getWorksheet("Data Pegawai") ??
      wb.worksheets.find((s) => s.name.toLowerCase().includes("data")) ??
      wb.worksheets[0];
    if (!ws) return [];

    // Baca setiap baris (skip baris kosong)
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      // Ekstrak nilai dari setiap kolom sesuai header
      const vals = IMPORT_HEADERS.map((_, i) => cellText(row.getCell(i + 1)));

      // Skip baris kosong dan baris catatan (contoh: "(baris contoh...)")
      if (vals.every((v) => !v)) return;
      if (vals[0]?.startsWith("(")) return;

      rows.push(vals);
    });
    return rows;
  }

  throw Object.assign(new Error("Format file harus .xlsx atau .csv"), { status: 400 });
}

/**
 * Memvalidasi apakah header baris pertama sesuai dengan template.
 * Menghapus BOM (Byte Order Mark) jika ada dan membandingkan dengan IMPORT_HEADERS.
 */
export function headerMatches(header: string[] | undefined) {
  if (!header) return false;
  const normalized = header.map((h) => h.replace(/^\uFEFF/, "").trim());
  return IMPORT_HEADERS.every((h, i) => normalized[i] === h);
}
