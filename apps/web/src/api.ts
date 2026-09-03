/**
 * api.ts — Client API Frontend
 *
 * File ini berisi semua fungsi untuk berkomunikasi dengan backend API.
 * Setiap fungsi mengembalikan Promise yang sudah di-type dengan benar.
 *
 * Fitur:
 * - Otomatis mengirim cookie sesi (credentials: "include")
 * - Error handling: melempar Error dengan pesan dari server
 * - TypeScript types untuk semua respons API
 */

/** Tipe peran pengguna (harus sama dengan backend) */
export type Role = "admin" | "assessor" | "employee" | "leadership";

/** Tipe data sesi pengguna yang dikirim dari backend */
export type SessionUser = {
	id: string;
	email: string;
	fullName: string;
	nip: string | null;
	jabatan: string | null;
	unitId: string | null;
	roles: Role[];
	mustChangePassword: boolean;
};

/**
 * Fungsi dasar untuk melakukan request ke API.
 * Menangani: fetch, error handling, dan parsing JSON.
 *
 * @param path - URL endpoint (contoh: "/api/me")
 * @param init - Opsi RequestInit tambahan (method, body, headers)
 * @returns Data yang sudah di-parse dari JSON
 * @throws Error jika response status bukan 2xx
 */
async function req<T>(path: string, init?: RequestInit): Promise<T> {
	const csrfToken = getCsrfToken();
	const headers: Record<string, string> = {
		...(init?.body instanceof FormData
			? {}
			: { "Content-Type": "application/json" }),
		...((init?.headers as Record<string, string>) ?? {}),
	};

	// For POST, PATCH, DELETE methods, add the X-CSRF-Token header
	// (skip for login & logout — backend juga exempt ini)
	const csrfExempt = ["/api/auth/login", "/api/auth/logout"];
	if (
		["POST", "PATCH", "DELETE"].includes(init?.method?.toUpperCase() ?? "GET") &&
		!csrfExempt.some((p) => path.startsWith(p))
	) {
		if (!csrfToken) {
			throw new Error("CSRF token not found. Please log in again.");
		}
		headers["X-CSRF-Token"] = csrfToken;
	}

	const res = await fetch(path, {
		...init,
		credentials: "include", // Kirim cookie sesi
		headers,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data?.error?.message || res.statusText);
	}
	return data as T;
}

// Helper to get CSRF token from cookies
function getCsrfToken(): string | undefined {
	const name = "pp_csrf=";
	const decodedCookie = decodeURIComponent(document.cookie);
	const ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return undefined;
}

/**
 * Objek API — Berisi semua fungsi untuk berinteraksi dengan backend.
 *
 * Struktur:
 * - Autentikasi: login, logout, me, updateProfile, changePassword
 * - Notifikasi: notifications, readNotif
 * - Admin: periods, users, units, master data, reports
 * - Penilai: assessorEmployees, assessorForm, saveAssessment
 * - Pegawai: employeeDash, employeeHistory
 * - Pimpinan: leadership, unitEmployees
 */
import type { UnitLevel } from "@app/shared";

export const api = {
	login: (email: string, password: string) =>
		req<{ user: SessionUser }>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		}),
	logout: () => req("/api/auth/logout", { method: "POST" }),
	me: () => req<{ user: SessionUser }>("/api/me"),
	updateProfile: (nip: string, jabatan: string) =>
		req<{ user: SessionUser }>("/api/me/profile", {
			method: "PATCH",
			body: JSON.stringify({ nip, jabatan }),
		}),
	changePassword: (password: string, currentPassword?: string) =>
		req("/api/auth/change-password", {
			method: "POST",
			body: JSON.stringify({ password, currentPassword }),
		}),
	notifications: () => req<{ data: NotificationItem[] }>("/api/notifications"),
	readNotif: (id: string) =>
		req(`/api/notifications/${id}/read`, { method: "POST" }),
	master: () => req<MasterPayload>("/api/admin/master"),
	periods: () => req<{ data: Period[] }>("/api/admin/periods"),
	createPeriod: (body: unknown) =>
		req("/api/admin/periods", { method: "POST", body: JSON.stringify(body) }),
	activatePeriod: (id: string) =>
		req(`/api/admin/periods/${id}/activate`, { method: "POST" }),
	closePeriod: (id: string) =>
		req(`/api/admin/periods/${id}/close`, { method: "POST" }),
	reopenPeriod: (id: string) =>
		req(`/api/admin/periods/${id}/reopen`, { method: "POST" }),
	progress: (id: string) => req<Progress>(`/api/admin/periods/${id}/progress`),
	assignments: (id: string) =>
		req<{ data: Assignment[] }>(`/api/admin/periods/${id}/assignments`),
	patchAssignment: (id: string, assessorId: string) =>
		req(`/api/admin/assignments/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ assessorId }),
		}),
	notifyPeriod: (id: string) =>
		req<{ sent: number }>(`/api/admin/periods/${id}/notify`, {
			method: "POST",
		}),
	importCsv: async (periodId: string, file: File) => {
		const fd = new FormData();
		fd.append("file", file);
		const csrfToken = getCsrfToken();
		if (!csrfToken) throw new Error("CSRF token not found. Please log in again.");
		const res = await fetch(`/api/admin/periods/${periodId}/import`, {
			method: "POST",
			body: fd,
			credentials: "include",
			headers: {
				"X-CSRF-Token": csrfToken,
			},
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data?.error?.message || "Import gagal");
		return data as {
			imported: number;
			errors: string[];
			created: number;
			defaultPassword: string;
		};
	},
	downloadImportTemplate: async (periodId: string) => {
		const res = await fetch(`/api/admin/periods/${periodId}/import-template`, {
			credentials: "include",
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data?.error?.message || "Gagal mengunduh template");
		}
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "template-import-pegawai.xlsx";
		a.click();
		URL.revokeObjectURL(url);
	},
	users: () => req<{ data: UserRow[] }>("/api/admin/users"),
	createUser: (body: unknown) =>
		req("/api/admin/users", { method: "POST", body: JSON.stringify(body) }),
	patchUser: (id: string, body: unknown) =>
		req(`/api/admin/users/${id}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		}),
	setUserRoles: (id: string, roles: Role[]) =>
		req<{ ok: true; roles: Role[] }>(`/api/admin/users/${id}/roles`, {
			method: "PATCH",
			body: JSON.stringify({ roles }),
		}),
	resetPassword: (id: string) =>
		req<{ temporaryPassword: string; defaultPassword?: string }>(
			`/api/admin/users/${id}/reset-password`,
			{ method: "POST" },
		),
	units: () => req<{ data: Unit[] }>("/api/admin/units"),
	createUnit: (body: {
		code: string;
		name: string;
		level: UnitLevel;
		parentUnitId?: string | null;
	}) =>
		req<{ data: Unit }>("/api/admin/units", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	patchUnit: (
		id: string,
		body: {
			code?: string;
			name?: string;
			level?: UnitLevel;
			parentUnitId?: string | null;
			isActive?: boolean;
		},
	) =>
		req<{ ok: true; data: Unit }>(`/api/admin/units/${id}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		}),
	deleteUnit: (id: string) =>
		req<{ ok: true }>(`/api/admin/units/${id}`, { method: "DELETE" }),

	unitLeaders: () => req<{ data: UnitLeader[] }>("/api/admin/unit-leaders"),
	createUnitLeader: (body: UnitLeaderCreateBody) =>
		req<{ data: UnitLeader }>("/api/admin/unit-leaders", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	patchUnitLeader: (
		unitId: string,
		userId: string,
		body: UnitLeaderPatchBody,
	) =>
		req<{ ok: true }>(`/api/admin/unit-leaders/${unitId}/${userId}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		}),
	deleteUnitLeader: (unitId: string, userId: string) =>
		req<{ ok: true }>(`/api/admin/unit-leaders/${unitId}/${userId}`, {
			method: "DELETE",
		}),
	patchNilai: (id: string, body: unknown) =>
		req(`/api/admin/master/nilai-dasar/${id}`, {
			method: "PATCH",
			body: JSON.stringify(body),
		}),
	patchFeedback: (id: string, templateText: string) =>
		req(`/api/admin/master/feedback-templates/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ templateText }),
		}),
	patchAnchor: (id: string, anchorText: string) =>
		req(`/api/admin/master/bars-anchors/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ anchorText }),
		}),
	audit: () =>
		req<{ assessments: unknown[]; master: unknown[] }>(
			"/api/admin/reports/audit",
		),
	aggregated: (periodId?: string) =>
		req<AggReport>(
			`/api/admin/reports/aggregated${periodId ? `?periodId=${periodId}` : ""}`,
		),
	assessorEmployees: (periodId?: string) =>
		req<{ periodId: string; data: AssessorEmployee[] }>(
			`/api/assessor/employees${periodId ? `?periodId=${periodId}` : ""}`,
		),
	assessorForm: (id: string) =>
		req<AssessorForm>(`/api/assessor/assignments/${id}/form`),
	saveAssessment: (body: unknown) =>
		req("/api/assessor/assessments", {
			method: "POST",
			body: JSON.stringify(body),
		}),
	employeeDash: () => req<EmployeeDash>("/api/employee/dashboard"),
	employeeHistory: () =>
		req<{ data: AssessmentView[] }>("/api/employee/assessments/history"),
	leadership: (periodId?: string) =>
		req<AggReport>(
			`/api/leadership/dashboard${periodId ? `?periodId=${periodId}` : ""}`,
		),
	unitEmployees: (unitId: string, periodId?: string) =>
		req<{ data: UnitEmp[] }>(
			`/api/leadership/units/${unitId}/employees${periodId ? `?periodId=${periodId}` : ""}`,
		),
};

export type NotificationItem = {
	id: string;
	subject: string;
	body: string;
	isRead: number;
	createdAt: number;
};
export type Period = {
	id: string;
	name: string;
	quarter: string;
	year: number;
	startDate: number;
	endDate: number;
	deadlineDate: number;
	status: string;
};
export type Progress = {
	total: number;
	done: number;
	pending: number;
	percent: number;
	submitted?: number;
	draft?: number;
};
export type Assignment = {
	id: string;
	employeeId: string;
	assessorId: string | null;
	status: string;
	employeeName?: string;
	employeeNip?: string | null;
	employeeJabatan?: string | null;
	assessorName?: string;
	assessorNip?: string | null;
	unitName?: string;
};
export type UserRow = {
	id: string;
	email: string;
	fullName: string;
	nip: string | null;
	jabatan: string | null;
	isActive: number;
	roles: string[];
	unitName: string | null;
	unitId: string | null;
};
export type Unit = {
	id: string;
	code: string;
	name: string;
	level: string;
	parentUnitId: string | null;
};
export type UnitLeader = {
	unitId: string;
	userId: string;
	leaderRole: string;
	createdAt: number;
	updatedAt: number;
	userName?: string;
	unitName?: string;
};
export type UnitLeaderCreateBody = {
	unitId: string;
	userId: string;
	leaderRole: string;
};
export type UnitLeaderPatchBody = {
	leaderRole: string;
};
export type MasterPayload = {
	nilaiDasar: Array<{
		id: string;
		code: string;
		name: string;
		description: string;
	}>;
	panduan: Array<{
		id: string;
		nilaiDasarId: string;
		sequence: number;
		title: string;
	}>;
	barsLevels: Array<{ level: number; name: string }>;
	anchors: Array<{
		id: string;
		nilaiDasarId: string;
		level: number;
		anchorText: string;
	}>;
	feedbackTemplates: Array<{
		id: string;
		nilaiDasarId: string;
		level: number;
		templateText: string;
	}>;
};
export type AssessorEmployee = {
	id: string;
	employeeId: string;
	employeeName?: string;
	nip?: string;
	jabatan?: string;
	status: string;
	scoreScale120: number | null;
	submittedAt: number | null;
	budayaEksekusiEfektif?: number | null;
	budayaCaraKerjaBaru?: number | null;
	budayaPelayananUnggul?: number | null;
};
export type AssessmentView = {
	id: string;
	status: string;
	additionalFeedback: string | null;
	scores: Record<string, number>;
	calculations: {
		totalScore: number;
		scoreScale120: number;
		perNilai120: Record<string, number>;
		budayaEksekusiEfektif: number;
		budayaCaraKerjaBaru: number;
		budayaPelayananUnggul: number;
		kategoriNilaiPerilaku: string;
		kategoriEksekusiEfektif: string;
		kategoriCaraKerjaBaru: string;
		kategoriPelayananUnggul: string;
	};
	feedbacks: Array<{
		nilaiDasarCode: string;
		level: number;
		feedbackText: string;
		wasCustomized: boolean;
	}>;
	periodName?: string;
};
export type AssessorForm = {
	assignment: Assignment & { periodId: string };
	employee: {
		id: string;
		fullName: string;
		nip: string;
		jabatan: string;
	} | null;
	assessment: AssessmentView | null;
};
export type EmployeeDash = {
	period: Period | null;
	assessorName: string | null;
	assessment: AssessmentView | null;
	assignment: { status: string } | null;
};
export type AggReport = {
	period: Period | null;
	totalAssigned: number;
	done: number;
	percent: number;
	avg120: number;
	avgEE: number;
	avgCK: number;
	avgPU: number;
	kategori: string;
	byUnit: Array<{
		unitId: string;
		unitName: string;
		count: number;
		totalAssigned: number;
		avg120: number;
		ee: number;
		ck: number;
		pu: number;
		kategori: string;
	}>;
	distribution: Array<{ level: number; count: number }>;
};
export type UnitEmp = {
	employeeId: string;
	name: string;
	nip: string;
	status: string;
	scoreScale120: number | null;
	kategori: string | null;
	budayaEksekusiEfektif?: number | null;
	budayaCaraKerjaBaru?: number | null;
	budayaPelayananUnggul?: number | null;
};
