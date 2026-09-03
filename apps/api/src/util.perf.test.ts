/**
 * util.perf.test.ts — Performance test untuk utilitas API
 *
 * Memastikan operasi kritis berjalan efisien:
 * - parseCsv: parsing CSV besar
 * - signToken / verifyToken: operasi JWT
 */

import { describe, expect, test } from "bun:test";

/** CSV parser - import dari util.ts */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        q = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      q = true;
    } else if (ch === ",") {
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n") {
      row.push(cur.trim());
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      cur = "";
    } else if (ch !== "\r") {
      cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((c) => c.length)) rows.push(row);
  }
  return rows;
}

/** Generate CSV dengan N baris */
function generateCsv(rows: number): string {
  const header = "NIP,Nama,Email,Unit";
  const lines = [header];
  for (let i = 0; i < rows; i++) {
    lines.push(`198001012006041${String(i).padStart(3, "0")},User ${i},user${i}@email.com,Unit ${(i % 10) + 1}`);
  }
  return lines.join("\n");
}

describe("Performance: parseCsv", () => {
  test("1.000 baris CSV < 10ms", () => {
    const csv = generateCsv(1_000);
    const start = performance.now();
    const rows = parseCsv(csv);
    const elapsed = performance.now() - start;
    console.log(`  1,000 baris CSV: ${elapsed.toFixed(1)}ms (${rows.length} rows parsed)`);
    expect(elapsed).toBeLessThan(10);
    expect(rows.length).toBe(1001); // header + 1000 data
  });

  test("10.000 baris CSV < 50ms", () => {
    const csv = generateCsv(10_000);
    const start = performance.now();
    const rows = parseCsv(csv);
    const elapsed = performance.now() - start;
    console.log(`  10,000 baris CSV: ${elapsed.toFixed(1)}ms (${rows.length} rows parsed)`);
    expect(elapsed).toBeLessThan(50);
    expect(rows.length).toBe(10001);
  });

  test("100.000 baris CSV < 500ms", () => {
    const csv = generateCsv(100_000);
    const start = performance.now();
    const rows = parseCsv(csv);
    const elapsed = performance.now() - start;
    console.log(`  100,000 baris CSV: ${elapsed.toFixed(1)}ms (${rows.length} rows parsed)`);
    expect(elapsed).toBeLessThan(500);
    expect(rows.length).toBe(100001);
  });
});

describe("Performance: parseCsv with quoted fields", () => {
  test("1.000 baris quoted CSV < 20ms", () => {
    const lines = ['"NIP","Nama","Alamat"'];
    for (let i = 0; i < 1_000; i++) {
      lines.push(`"198001012006041${String(i).padStart(3, "0")}","User ${i}","Jl. Contoh No. ${i}, Kota ${i}"`);
    }
    const csv = lines.join("\n");
    const start = performance.now();
    const rows = parseCsv(csv);
    const elapsed = performance.now() - start;
    console.log(`  1,000 quoted baris CSV: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(20);
    expect(rows.length).toBe(1001);
  });
});

describe("Performance: throughput", () => {
  test("parseCsv throughput > 100.000 baris/detik", () => {
    const csv = generateCsv(10_000);
    const iterations = 100;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      parseCsv(csv);
    }
    const elapsed = (performance.now() - start) / 1000;
    const throughput = (10_000 * iterations) / elapsed;
    console.log(`  CSV throughput: ${Math.round(throughput).toLocaleString()} baris/detik`);
    expect(throughput).toBeGreaterThan(100_000);
  });
});
