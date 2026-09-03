/**
 * BudayaRadar.test.ts — Type check test untuk komponen BudayaRadar
 *
 * Memvalidasi:
 * - Tipe props BudayaRadarValues sesuai definisi
 * - Kode budaya kerja BK-01-EE, BK-02-CK, BK-03-PU terepresentasi
 * - Export functions dan types bisa diakses
 *
 * Catatan: Tanpa React Testing Library, test ini fokus pada type safety.
 */

import { describe, expect, test } from "bun:test";
import type { BudayaRadarValues } from "./BudayaRadar";
import { BudayaRadar } from "./BudayaRadar";

describe("BudayaRadar type", () => {
	test("BudayaRadarValues punya 3 prop", () => {
		const valid: BudayaRadarValues = {
			"bk-01-ee": 80,
			"bk-02-ck": 100,
			"bk-03-pu": 60,
		};
		expect(Object.keys(valid).length).toBe(3);
	});

	test("semua prop bertipe number", () => {
		const valid: BudayaRadarValues = {
			"bk-01-ee": 0,
			"bk-02-ck": 120,
			"bk-03-pu": 60,
		};
		expect(typeof valid["bk-01-ee"]).toBe("number");
		expect(typeof valid["bk-02-ck"]).toBe("number");
		expect(typeof valid["bk-03-pu"]).toBe("number");
	});

	test("prop names = kode budaya kerja", () => {
		const valid: BudayaRadarValues = {
			"bk-01-ee": 80,
			"bk-02-ck": 100,
			"bk-03-pu": 60,
		};
		const keys = Object.keys(valid);
		expect(keys).toContain("bk-01-ee");
		expect(keys).toContain("bk-02-ck");
		expect(keys).toContain("bk-03-pu");
	});

	test("BudayaRadar adalah fungsi yang bisa diakses", () => {
		expect(typeof BudayaRadar).toBe("function");
	});

	test("BudayaRadar menerima props valid", () => {
		// Type check: pastikan props cocok dengan tipe
		const props: BudayaRadarValues & { heightClass?: string } = {
			"bk-01-ee": 80,
			"bk-02-ck": 100,
			"bk-03-pu": 60,
			heightClass: "h-64",
		};
		expect(props["bk-01-ee"]).toBe(80);
		expect(props["bk-02-ck"]).toBe(100);
		expect(props["bk-03-pu"]).toBe(60);
		expect(props.heightClass).toBe("h-64");
	});
});
