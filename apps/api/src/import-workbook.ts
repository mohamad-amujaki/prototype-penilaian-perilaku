import ExcelJS from "exceljs";
import { parseCsv } from "./util";

export const IMPORT_HEADERS = [
  "NIP",
  "Nama",
  "PangkatGolongan",
  "UnitKode",
  "UnitNama",
  "Jabatan",
  "Email",
  "NIP_Atasan",
] as const;

export async function buildImportTemplate(periodName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Penilaian Perilaku ASN Kemenkes";
  wb.created = new Date();

  const panduan = wb.addWorksheet("Petunjuk", { views: [{ showGridLines: false }] });
  panduan.getColumn(1).width = 92;
  panduan.getCell("A1").value = "Template Import Pegawai & Assignment";
  panduan.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF185FA5" } };
  panduan.getCell("A2").value = `Periode: ${periodName}`;
  panduan.getCell("A4").value = "Cara pakai";
  panduan.getCell("A4").font = { bold: true };
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

  const data = wb.addWorksheet("Data Pegawai");
  data.views = [{ state: "frozen", ySplit: 1 }];
  IMPORT_HEADERS.forEach((h, i) => {
    const cell = data.getCell(1, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF185FA5" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  data.getRow(1).height = 22;
  data.getColumn(1).numFmt = "@";
  data.getColumn(8).numFmt = "@";
  const widths = [22, 28, 20, 14, 22, 24, 32, 22];
  widths.forEach((w, i) => {
    data.getColumn(i + 1).width = w;
  });

  const examples = [
    [
      "19870217200912001",
      "Mohamad Arif Mujaki",
      "Penata / III.c",
      "SK-KIN",
      "Seksi Kinerja",
      "Analis Kinerja",
      "arif.mujaki@kemkes.go.id",
      "19750105199203001",
    ],
    [
      "19800605200812002",
      "Ani Suryani",
      "Penata Muda / III.a",
      "SK-KIN",
      "Seksi Kinerja",
      "Analyst",
      "ani.suryani@kemkes.go.id",
      "19870217200912001",
    ],
  ];
  examples.forEach((row, r) => {
    row.forEach((val, c) => {
      const cell = data.getCell(r + 2, c + 1);
      cell.value = val;
      cell.font = { italic: true, color: { argb: "FF64748B" } };
    });
  });
  data.getCell("A11").value = "(baris contoh di atas boleh dihapus atau ditimpa)";
  data.getCell("A11").font = { italic: true, color: { argb: "FF94A3B8" }, size: 10 };
  data.mergeCells("A11:H11");

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function normalizeNip(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

/** Seed/demo NIP sometimes omit the gender digit (pos 9). Official NIP is 18 digits. */
export function nipsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = normalizeNip(a);
  const db = normalizeNip(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const withoutGender = (n: string) => (n.length === 18 ? n.slice(0, 8) + n.slice(9) : n);
  return withoutGender(da) === withoutGender(db);
}

function valueText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "number") {
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

function cellText(cell: ExcelJS.Cell): string {
  const displayed = String(cell.text ?? "").replace(/\u00a0/g, " ").trim();
  if (displayed && !/e[+\-]?\d+$/i.test(displayed)) return displayed;
  return valueText(cell.value);
}

export async function parseImportFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type.includes("csv")) {
    const text = await file.text();
    return parseCsv(text);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet") || file.type.includes("excel")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws =
      wb.getWorksheet("Data Pegawai") ??
      wb.worksheets.find((s) => s.name.toLowerCase().includes("data")) ??
      wb.worksheets[0];
    if (!ws) return [];
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = IMPORT_HEADERS.map((_, i) => cellText(row.getCell(i + 1)));
      if (vals.every((v) => !v)) return;
      if (vals[0]?.startsWith("(")) return;
      rows.push(vals);
    });
    return rows;
  }
  throw Object.assign(new Error("Format file harus .xlsx atau .csv"), { status: 400 });
}

export function headerMatches(header: string[] | undefined) {
  if (!header) return false;
  const normalized = header.map((h) => h.replace(/^\uFEFF/, "").trim());
  return IMPORT_HEADERS.every((h, i) => normalized[i] === h);
}
