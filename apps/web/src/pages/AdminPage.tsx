/**
 * AdminPage.tsx — Halaman Manajemen Administrator
 *
 * Dirancang dengan standar UX Modern Enterprise:
 * 1. Periode: Status-aware actions, progress monitoring, form terstruktur, import Excel
 * 2. Unit Kerja & Pegawai: Navigasi pohon hierarki organisasi, rincian pegawai per unit, kelola unit
 * 3. Penugasan: Filter pintar (Belum ada penilai, Status), pencarian cepat, assign atasan
 * 4. Pengguna: Manajemen multi-role dengan badge interaktif, dialog konfirmasi reset password
 * 5. Master Data: Sub-navigasi 7 Nilai Dasar BerAKHLAK (Level 1-5 BARS & Feedback template)
 * 6. Log Audit: Tabel human-readable dengan timestamp lokal + toggle inspeksi JSON
 */

import { UnitLevel, UnitLevelDisplayNames } from "@app/shared";
import { useEffect, useMemo, useState } from "react";
import {
	type Assignment,
	api,
	type MasterPayload,
	type Period,
	type Progress,
	type Role,
	type Unit,
	type UnitLeader,
	type UserRow,
} from "../api";
import { useAuth } from "../auth";
import { PersonSelect } from "../components/PersonSelect";
import {
	Badge,
	Banner,
	Button,
	Card,
	Field,
	PageHeader,
	TableWrap,
} from "../components/ui";
import { useToast } from "../toast";

/** Mengkonversi tanggal (YYYY-MM-DD) ke Unix timestamp (detik) */
function toEpoch(date: string) {
	return Math.floor(new Date(date).getTime() / 1000);
}

/** Format timestamp epoch ke tanggal lokal Indonesia */
function formatEpoch(epoch: number | null | undefined): string {
	if (!epoch) return "-";
	return new Date(epoch * 1000).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** Format timestamp epoch ke tanggal & jam lokal */
function formatEpochFull(epoch: number | null | undefined): string {
	if (!epoch) return "-";
	return new Date(epoch * 1000).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Definisi 6 Tab Utama Admin */
const TABS = [
	{ id: "periode", label: "Periode", icon: "📅" },
	{ id: "units", label: "Unit Kerja & Pegawai", icon: "🏛️" },
	{ id: "atasan", label: "Penugasan Penilai", icon: "👥" },
	{ id: "pengguna", label: "Pengguna & Peran", icon: "👤" },
	{ id: "master", label: "Master BerAKHLAK", icon: "⚙️" },
	{ id: "audit", label: "Log Audit", icon: "📜" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminPage() {
	const [tab, setTab] = useState<TabId>("periode");

	return (
		<div className="space-y-6">
			<PageHeader
				title="Pusat Kendali Admin"
				sub="Kelola siklus periode penilaian, struktur unit kerja, penugasan atasan, akun pengguna, master data BerAKHLAK, dan jejak audit."
			/>

			{/* Navigasi Tab Utama */}
			<div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-surface">
				{TABS.map((t) => {
					const active = tab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => setTab(t.id)}
							className={`ui-btn shrink-0 flex-1 gap-2 rounded-xl py-2.5 text-xs font-semibold sm:text-sm transition-all ${
								active
									? "bg-brand text-white shadow-sm"
									: "text-ink-muted hover:bg-slate-50 hover:text-ink"
							}`}
						>
							<span>{t.icon}</span>
							<span>{t.label}</span>
						</button>
					);
				})}
			</div>

			{/* Konten Tab Aktif */}
			{tab === "periode" && <Periods />}
			{tab === "units" && <UnitManager />}
			{tab === "atasan" && <Atasan />}
			{tab === "pengguna" && <Users />}
			{tab === "master" && <Master />}
			{tab === "audit" && <Audit />}
		</div>
	);
}

// ============================================================================
// TAB 1: PERIODE & IMPORT
// ============================================================================

function Periods() {
	const toast = useToast();
	const [periods, setPeriods] = useState<Period[]>([]);
	const [activePeriod, setActivePeriod] = useState<Period | null>(null);
	const [progress, setProgress] = useState<Progress | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [sel, setSel] = useState<string>("");
	const [file, setFile] = useState<File | null>(null);
	const [importing, setImporting] = useState(false);
	const [importNotes, setImportNotes] = useState("");

	const [form, setForm] = useState({
		name: "Q2 2026",
		quarter: "Q2",
		year: 2026,
		start: "2026-04-01",
		end: "2026-06-30",
		deadline: "2026-07-31",
	});

	async function load() {
		try {
			const p = await api.periods();
			setPeriods(p.data);
			const act = p.data.find((x) => x.status === "active") ?? null;
			setActivePeriod(act);
			if (!sel && p.data[0]) setSel(p.data[0].id);

			if (act) {
				const prog = await api.progress(act.id).catch(() => null);
				setProgress(prog);
			}
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	useEffect(() => {
		void load();
	}, []);

	async function handleActivate(p: Period) {
		try {
			await api.activatePeriod(p.id);
			toast.push(`Periode ${p.name} berhasil diaktifkan`);
			await load();
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	async function handleClose(p: Period) {
		try {
			await api.closePeriod(p.id);
			toast.push(`Periode ${p.name} resmi ditutup`);
			await load();
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	async function handleReopen(p: Period) {
		try {
			await api.reopenPeriod(p.id);
			toast.push(`Periode ${p.name} dibuka kembali`);
			await load();
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	async function handleNotify(p: Period) {
		try {
			const res = await api.notifyPeriod(p.id);
			toast.push(`Pengingat berhasil dikirim ke ${res.sent} penilai`);
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		try {
			await api.createPeriod({
				name: form.name,
				quarter: form.quarter,
				year: Number(form.year),
				startDate: toEpoch(form.start),
				endDate: toEpoch(form.end),
				deadlineDate: toEpoch(form.deadline),
			});
			toast.push(`Periode ${form.name} berhasil dibuat sebagai draft`);
			setShowCreate(false);
			await load();
		} catch (ex) {
			toast.push((ex as Error).message, "error");
		}
	}

	async function handleImport() {
		if (!file || !sel) {
			toast.push("Pilih file Excel/CSV terlebih dahulu", "error");
			return;
		}
		setImporting(true);
		try {
			const res = await api.importCsv(sel, file);
			toast.push(`Import berhasil: ${res.imported} data diproses`);
			setImportNotes(
				[
					res.created
						? `${res.created} akun baru dibuat (password default: ${res.defaultPassword}).`
						: "",
					res.errors.length ? `Catatan: ${res.errors.join("; ")}` : "",
				]
					.filter(Boolean)
					.join(" "),
			);
			setFile(null);
			await load();
		} catch (e) {
			toast.push((e as Error).message, "error");
		} finally {
			setImporting(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* ==================== ACTIVE PERIOD KPI HERO ==================== */}
			{activePeriod ? (
				<div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark via-brand to-brand-mid p-6 text-white shadow-lift">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
								<span className="text-xs font-semibold tracking-wider uppercase text-white/80">
									Periode Aktif Berjalan
								</span>
							</div>
							<h2 className="mt-1 text-2xl font-bold tracking-tight">
								{activePeriod.name}
							</h2>
							<p className="mt-1 text-xs text-white/70">
								Masa Penilaian: {formatEpoch(activePeriod.startDate)} –{" "}
								{formatEpoch(activePeriod.endDate)} · Batas Akhir:{" "}
								<span className="font-semibold text-amber-200">
									{formatEpoch(activePeriod.deadlineDate)}
								</span>
							</p>
						</div>

						{/* Quick Actions for Active Period */}
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="ghost"
								className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 text-xs py-2"
								onClick={() => void handleNotify(activePeriod)}
							>
								✉️ Kirim Reminder Penilai
							</Button>
							<Button
								variant="ghost"
								className="!bg-rose-500/80 !text-white !border-rose-400 hover:!bg-rose-600 text-xs py-2"
								onClick={() => void handleClose(activePeriod)}
							>
								🔒 Tutup Periode
							</Button>
						</div>
					</div>

					{/* Progress Bar if available */}
					{progress ? (
						<div className="mt-6 border-t border-white/15 pt-4">
							<div className="flex items-center justify-between text-xs font-medium text-white/90 mb-1.5">
								<span>Progres Pengisian Penilaian Organisasi</span>
								<span>
									{progress.done} dari {progress.total} Pegawai Selesai (
									{progress.percent}%)
								</span>
							</div>
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
								<div
									className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
									style={{
										width: `${progress.total ? Math.min(100, progress.percent) : 0}%`,
									}}
								/>
							</div>
							<div className="mt-2 flex gap-4 text-[11px] text-white/70">
								<span>⏳ Pending: {progress.pending}</span>
								<span>✅ Selesai: {progress.done}</span>
							</div>
						</div>
					) : null}
				</div>
			) : (
				<Card className="border-l-4 border-amber-500 bg-amber-50/60">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-amber-900">
								Tidak ada periode yang aktif saat ini
							</h3>
							<p className="text-xs text-amber-700">
								Aktifkan salah satu periode draft di bawah agar penilai dapat
								mulai mengisi evaluasi.
							</p>
						</div>
					</div>
				</Card>
			)}

			{/* ==================== DAFTAR SEMUA PERIODE ==================== */}
			<Card>
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-semibold text-base">Semua Periode Penilaian</h2>
						<p className="ui-sub">
							Daftar triwulan penilaian yang telah didaftarkan dalam sistem.
						</p>
					</div>
					<Button
						onClick={() => setShowCreate((v) => !v)}
						variant={showCreate ? "ghost" : "primary"}
						className="text-xs py-2"
					>
						{showCreate ? "Tutup Form" : "+ Buat Periode Baru"}
					</Button>
				</div>

				{/* Modal / Inline Form Buat Periode */}
				{showCreate && (
					<form
						onSubmit={(e) => void handleCreate(e)}
						className="mb-6 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-900/5 space-y-4"
					>
						<h3 className="font-semibold text-sm text-ink">
							Formulir Pendaftaran Periode Baru
						</h3>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							<Field label="Nama Periode">
								<input
									className="ui-input mt-1"
									required
									placeholder="Contoh: Q2 2026"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
							</Field>
							<Field label="Triwulan">
								<select
									className="ui-input mt-1"
									value={form.quarter}
									onChange={(e) =>
										setForm({ ...form, quarter: e.target.value })
									}
								>
									{["Q1", "Q2", "Q3", "Q4"].map((q) => (
										<option key={q} value={q}>
											Triwulan {q}
										</option>
									))}
								</select>
							</Field>
							<Field label="Tahun">
								<input
									className="ui-input mt-1"
									type="number"
									required
									value={form.year}
									onChange={(e) =>
										setForm({ ...form, year: Number(e.target.value) })
									}
								/>
							</Field>
							<Field label="Tanggal Mulai Kinerja">
								<input
									className="ui-input mt-1"
									type="date"
									required
									value={form.start}
									onChange={(e) => setForm({ ...form, start: e.target.value })}
								/>
							</Field>
							<Field label="Tanggal Selesai Kinerja">
								<input
									className="ui-input mt-1"
									type="date"
									required
									value={form.end}
									onChange={(e) => setForm({ ...form, end: e.target.value })}
								/>
							</Field>
							<Field label="Batas Akhir Penilaian (Deadline)">
								<input
									className="ui-input mt-1"
									type="date"
									required
									value={form.deadline}
									onChange={(e) =>
										setForm({ ...form, deadline: e.target.value })
									}
								/>
							</Field>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setShowCreate(false)}
								className="text-xs"
							>
								Batal
							</Button>
							<Button type="submit" className="text-xs">
								Simpan Sebagai Draft
							</Button>
						</div>
					</form>
				)}

				<TableWrap>
					<thead>
						<tr>
							<th>Periode</th>
							<th>Rentang Kerja</th>
							<th>Batas Akhir</th>
							<th>Status</th>
							<th className="text-right">Aksi Status</th>
						</tr>
					</thead>
					<tbody>
						{periods.map((p) => {
							const isSelected = sel === p.id;
							return (
								<tr
									key={p.id}
									className={isSelected ? "bg-brand-light/40" : ""}
								>
									<td>
										<button
											type="button"
											className="font-semibold text-brand text-left hover:underline"
											onClick={() => setSel(p.id)}
										>
											{p.name}
										</button>
										<div className="text-[11px] text-ink-muted">
											Tahun {p.year} · {p.quarter}
										</div>
									</td>
									<td className="text-xs">
										{formatEpoch(p.startDate)} – {formatEpoch(p.endDate)}
									</td>
									<td className="text-xs font-medium text-ink">
										{formatEpoch(p.deadlineDate)}
									</td>
									<td>
										<Badge status={p.status} />
									</td>
									<td className="text-right space-x-1.5 whitespace-nowrap">
										{p.status === "draft" && (
											<Button
												variant="primary"
												className="text-xs py-1 px-2.5 !bg-emerald-600 hover:!bg-emerald-700"
												onClick={() => void handleActivate(p)}
											>
												Aktifkan
											</Button>
										)}
										{p.status === "active" && (
											<Button
												variant="ghost"
												className="text-xs py-1 px-2.5 !text-rose-700 hover:!bg-rose-50"
												onClick={() => void handleClose(p)}
											>
												Tutup
											</Button>
										)}
										{p.status === "closed" && (
											<Button
												variant="ghost"
												className="text-xs py-1 px-2.5"
												onClick={() => void handleReopen(p)}
											>
												Buka Kembali
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</TableWrap>
			</Card>

			{/* ==================== IMPORT PEGAWAI DARI EXCEL ==================== */}
			{sel && (
				<Card>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="font-semibold text-base">
								Import Pegawai & Penugasan Atasan
							</h2>
							<p className="ui-sub">
								Unduh template Excel resmi, isi data pegawai beserta NIP atasan,
								lalu unggah ke sistem.
							</p>
						</div>
						<Button
							variant="ghost"
							className="text-xs self-start shrink-0"
							onClick={() =>
								void api
									.downloadImportTemplate(sel)
									.catch((e) => toast.push((e as Error).message, "error"))
							}
						>
							📥 Unduh Template Excel (.xlsx)
						</Button>
					</div>

					<div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 text-xl">
							📄
						</div>
						<p className="mt-2 text-sm font-medium text-ink">
							Pilih Berkas Excel / CSV Pegawai
						</p>
						<p className="text-xs text-ink-muted">
							Format yang didukung: .xlsx, .xls, .csv
						</p>

						<div className="mt-4 flex flex-wrap items-center justify-center gap-3">
							<label className="ui-btn-ghost cursor-pointer text-xs py-2 px-4">
								Pilih File Komputer
								<input
									className="hidden"
									type="file"
									accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
									onChange={(e) => setFile(e.target.files?.[0] ?? null)}
								/>
							</label>

							{file ? (
								<div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs shadow-sm ring-1 ring-slate-200">
									<span className="font-medium text-ink truncate max-w-xs">
										{file.name}
									</span>
									<button
										type="button"
										onClick={() => setFile(null)}
										className="text-rose-500 hover:text-rose-700"
										aria-label="Hapus file"
									>
										✕
									</button>
								</div>
							) : null}

							<Button
								disabled={!file || importing}
								onClick={() => void handleImport()}
								className="text-xs py-2 px-4"
							>
								{importing ? "Mengimpor Data…" : "Unggah & Proses"}
							</Button>
						</div>
					</div>

					{importNotes && (
						<div className="mt-4">
							<Banner>{importNotes}</Banner>
						</div>
					)}
				</Card>
			)}
		</div>
	);
}

// ============================================================================
// TAB 2: UNIT KERJA & PEGAWAI (HIERARKI & ROSTER)
// ============================================================================

function UnitManager() {
	const toast = useToast();
	const [units, setUnits] = useState<Unit[]>([]);
	const [users, setUsers] = useState<UserRow[]>([]);
	const [unitLeaders, setUnitLeaders] = useState<UnitLeader[]>([]);
	const [selectedUnitId, setSelectedUnitId] = useState<string>("");
	const [searchUnit, setSearchUnit] = useState("");
	const [searchUser, setSearchUser] = useState("");

	// Modal State
	const [unitModal, setUnitModal] = useState<{
		open: boolean;
		mode: "create" | "edit";
		data?: Unit;
	}>({
		open: false,
		mode: "create",
	});
	const [unitForm, setUnitForm] = useState({
		code: "",
		name: "",
		level: UnitLevel.TIM_KERJA,
		parentUnitId: "",
	});

	const [moveModal, setMoveModal] = useState<{ open: boolean; user?: UserRow }>(
		{ open: false },
	);
	const [targetUnitId, setTargetUnitId] = useState("");

	const [leaderModal, setLeaderModal] = useState<{
		open: boolean;
		unitId: string;
		userId?: string;
		leaderRole?: string;
	}>({ open: false, unitId: "" });

	async function loadData() {
		try {
			const [uRes, usrRes, ulRes] = await Promise.all([
				api.units(),
				api.users(),
				api.unitLeaders(),
			]);
			setUnits(uRes.data);
			setUsers(usrRes.data);
			setUnitLeaders(ulRes.data);
			if (!selectedUnitId && uRes.data[0]) {
				setSelectedUnitId(uRes.data[0].id);
			}
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	useEffect(() => {
		void loadData();
	}, []);

	// Map jumlah pegawai langsung per unit
	const directCounts = useMemo(() => {
		const map = new Map<string, number>();
		for (const u of users) {
			if (u.unitId) {
				map.set(u.unitId, (map.get(u.unitId) ?? 0) + 1);
			}
		}
		return map;
	}, [users]);

	// Unit yang terpilih saat ini
	const activeUnit = useMemo(() => {
		return units.find((u) => u.id === selectedUnitId) ?? units[0] ?? null;
	}, [units, selectedUnitId]);

	// Pegawai langsung di unit terpilih
	const unitEmployees = useMemo(() => {
		if (!activeUnit) return [];
		const q = searchUser.trim().toLowerCase();
		return users.filter((u) => {
			if (u.unitId !== activeUnit.id) return false;
			if (!q) return true;
			return (
				u.fullName.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				(u.nip ?? "").includes(q) ||
				(u.jabatan ?? "").toLowerCase().includes(q)
			);
		});
	}, [users, activeUnit, searchUser]);

	// Anak unit langsung di bawah unit terpilih
	const childUnits = useMemo(() => {
		if (!activeUnit) return [];
		return units.filter((u) => u.parentUnitId === activeUnit.id);
	}, [units, activeUnit]);

	// Parent unit object
	const parentUnit = useMemo(() => {
		if (!activeUnit?.parentUnitId) return null;
		return units.find((u) => u.id === activeUnit.parentUnitId) ?? null;
	}, [units, activeUnit]);

	// Leaders of the active unit
	const activeUnitLeaders = useMemo(() => {
		if (!activeUnit) return [];
		return unitLeaders.filter((ul) => ul.unitId === activeUnit.id);
	}, [unitLeaders, activeUnit]);

	// Build unit tree
	const unitTree = useMemo(() => {
		const unitMap = new Map<string, Unit & { children: Unit[] }>();
		for (const u of units) unitMap.set(u.id, { ...u, children: [] });

		const tree: (Unit & { children: Unit[] })[] = [];
		unitMap.forEach((u) => {
			if (u.parentUnitId && unitMap.has(u.parentUnitId)) {
				unitMap.get(u.parentUnitId)?.children.push(u);
			} else {
				tree.push(u);
			}
		});

		// Sort function for units, prioritizing higher levels first, then alphabetically
		const sortUnits = (a: Unit, b: Unit) => {
			const levelOrder: Record<string, number> = {
				[UnitLevel.ESELON_1]: 0,
				[UnitLevel.UNIT_KERJA]: 1,
				[UnitLevel.TIM_KERJA]: 2,
				[UnitLevel.SEKSI]: 3,
				[UnitLevel.LAINNYA]: 4,
			};
			const orderA = levelOrder[a.level] ?? 5;
			const orderB = levelOrder[b.level] ?? 5;
			if (orderA !== orderB) {
				return orderA - orderB;
			}
			return a.name.localeCompare(b.name);
		};

		// Recursively sort children
		function sortTree(nodes: (Unit & { children: Unit[] })[]) {
			nodes.sort(sortUnits);
			nodes.forEach((node) => {
				if (node.children.length) {
					sortTree(node.children as (Unit & { children: Unit[] })[]);
				}
			});
		}

		sortTree(tree);
		return tree;
	}, [units]);

	// Flatten unit tree for display with search and indentation levels
	const displayUnits = useMemo(() => {
		const flatList: (Unit & { depth: number })[] = [];

		function traverse(nodes: (Unit & { children: Unit[] })[], depth: number) {
			nodes.forEach((node) => {
				flatList.push({ ...node, depth });
				if (node.children.length) {
					traverse(node.children as (Unit & { children: Unit[] })[], depth + 1);
				}
			});
		}

		traverse(unitTree, 0);
		return flatList;
	}, [unitTree]);

	// Filter unit di sidebar
	const filteredUnits = useMemo(() => {
		const s = searchUnit.trim().toLowerCase();
		if (!s) return displayUnits;
		return displayUnits.filter(
			(u) =>
				u.name.toLowerCase().includes(s) || u.code.toLowerCase().includes(s),
		);
	}, [displayUnits, searchUnit]);

	function openCreateModal(parentId?: string) {
		setUnitForm({
			code: "",
			name: "",
			level: UnitLevel.TIM_KERJA,
			parentUnitId: parentId ?? activeUnit?.id ?? "",
		});
		setUnitModal({ open: true, mode: "create" });
	}

	function openEditModal(unit: Unit) {
		setUnitForm({
			code: unit.code,
			name: unit.name,
			level: unit.level as UnitLevel,
			parentUnitId: unit.parentUnitId ?? "",
		});
		setUnitModal({ open: true, mode: "edit", data: unit });
	}

	async function handleDeleteLeader(leader: UnitLeader) {
		if (
			!confirm(
				`Hapus ${leader.userName} sebagai pimpinan unit ${leader.unitName}?`,
			)
		) {
			return;
		}
		try {
			await api.deleteUnitLeader(leader.unitId, leader.userId);
			toast.push(`${leader.userName} berhasil dihapus dari pimpinan unit`);
			await loadData();
		} catch (err) {
			toast.push((err as Error).message, "error");
		}
	}

	async function handleSaveUnit(e: React.FormEvent) {
		e.preventDefault();
		try {
			if (unitModal.mode === "create") {
				const res = await api.createUnit({
					code: unitForm.code.trim().toUpperCase(),
					name: unitForm.name.trim(),
					level: unitForm.level,
					parentUnitId: unitForm.parentUnitId || null,
				});
				toast.push(`Unit ${unitForm.name} berhasil ditambahkan`);
				setSelectedUnitId(res.data.id);
			} else if (unitModal.data) {
				await api.patchUnit(unitModal.data.id, {
					code: unitForm.code.trim().toUpperCase(),
					name: unitForm.name.trim(),
					level: unitForm.level,
					parentUnitId: unitForm.parentUnitId || null,
				});
				toast.push(`Unit ${unitForm.name} berhasil diperbarui`);
			}
			setUnitModal({ open: false, mode: "create" });
			await loadData();
		} catch (err) {
			toast.push((err as Error).message, "error");
		}
	}

	async function handleDeleteUnit(unit: Unit) {
		if (
			!confirm(
				`Hapus unit "${unit.name}"? Unit hanya dapat dihapus jika tidak ada pegawai dan anak unit.`,
			)
		) {
			return;
		}
		try {
			await api.deleteUnit(unit.id);
			toast.push(`Unit ${unit.name} berhasil dihapus`);
			setSelectedUnitId(units.find((u) => u.id !== unit.id)?.id ?? "");
			await loadData();
		} catch (err) {
			toast.push((err as Error).message, "error");
		}
	}

	async function handleMoveEmployee(e: React.FormEvent) {
		e.preventDefault();
		if (!moveModal.user || !targetUnitId) return;
		try {
			await api.patchUser(moveModal.user.id, { unitId: targetUnitId });
			const targetName =
				units.find((u) => u.id === targetUnitId)?.name ?? "unit baru";
			toast.push(
				`Pegawai ${moveModal.user.fullName} dipindahkan ke ${targetName}`,
			);
			setMoveModal({ open: false });
			await loadData();
		} catch (err) {
			toast.push((err as Error).message, "error");
		}
	}

	async function handleSaveLeader(e: React.FormEvent) {
		e.preventDefault();
		if (!leaderModal.userId || !leaderModal.leaderRole) return;
		try {
			await api.createUnitLeader({
				unitId: leaderModal.unitId,
				userId: leaderModal.userId,
				leaderRole: leaderModal.leaderRole,
			});
			toast.push(`Pimpinan unit berhasil ditambahkan`);
			setLeaderModal({ open: false, unitId: "" });
			await loadData();
		} catch (err) {
			toast.push((err as Error).message, "error");
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-12">
			{/* ==================== PANEL KIRI: DAFTAR / POHON UNIT ==================== */}
			<div className="lg:col-span-5 space-y-4">
				<Card className="p-4">
					<div className="flex items-center justify-between gap-2 mb-3">
						<div>
							<h2 className="font-semibold text-sm text-ink">
								Struktur Organisasi
							</h2>
							<p className="text-[11px] text-ink-muted">
								{units.length} Unit Terdaftar
							</p>
						</div>
						<Button
							onClick={() => openCreateModal()}
							className="text-xs py-1.5 px-2.5"
						>
							+ Unit Baru
						</Button>
					</div>

					<div className="mb-3">
						<input
							className="ui-input mt-0 text-xs py-1.5"
							placeholder="Cari unit (nama atau kode)…"
							value={searchUnit}
							onChange={(e) => setSearchUnit(e.target.value)}
						/>
					</div>

					{/* List Unit Tree */}
					<div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
						{filteredUnits.map((u) => {
							const active = u.id === selectedUnitId;
							const count = directCounts.get(u.id) ?? 0;
							return (
								<button
									key={u.id}
									type="button"
									onClick={() => setSelectedUnitId(u.id)}
									className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs transition-all ${
										active
											? "bg-brand text-white shadow-sm font-semibold"
											: "bg-slate-50 text-ink hover:bg-slate-100 ring-1 ring-slate-900/5"
									} ${u.depth > 0 ? `pl-${u.depth * 4}` : ""}`}
								>
									<div className="min-w-0 flex-1 pr-2">
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] opacity-75 font-mono">
												{u.code}
											</span>
											<span
												className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
													active
														? "bg-white/20 text-white"
														: "bg-slate-200 text-ink-muted"
												}`}
											>
												{UnitLevelDisplayNames[u.level as UnitLevel]}
											</span>
										</div>
										<div className="truncate text-xs mt-0.5">{u.name}</div>
									</div>
									<span
										className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium ${
											active
												? "bg-white/20 text-white"
												: "bg-white text-ink-muted ring-1 ring-slate-200"
										}`}
									>
										👤 {count}
									</span>
								</button>
							);
						})}
					</div>
				</Card>
			</div>

			{/* ==================== PANEL KANAN: DETAIL UNIT & DAFTAR PEGAWAI ==================== */}
			<div className="lg:col-span-7 space-y-4">
				{activeUnit ? (
					<>
						{/* Header Detail Unit */}
						<Card className="p-5">
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<span className="font-mono text-xs font-bold text-brand uppercase">
											{activeUnit.code}
										</span>
										<span className="rounded bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
											Level:{" "}
											{UnitLevelDisplayNames[activeUnit.level as UnitLevel]}
										</span>
									</div>
									<h2 className="mt-1 text-xl font-bold text-ink">
										{activeUnit.name}
									</h2>
									{parentUnit ? (
										<p className="mt-1 text-xs text-ink-muted">
											Induk Organisasi:{" "}
											<span className="font-semibold text-ink">
												{parentUnit.name}
											</span>{" "}
											({parentUnit.code})
										</p>
									) : (
										<p className="mt-1 text-xs text-ink-muted">
											Unit Induk Tertinggi (Top Level)
										</p>
									)}
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<Button
										variant="ghost"
										className="text-xs py-1.5 px-3"
										onClick={() => openEditModal(activeUnit)}
									>
										✏️ Edit
									</Button>
									<Button
										variant="ghost"
										className="text-xs py-1.5 px-3 !text-rose-600 hover:!bg-rose-50"
										onClick={() => void handleDeleteUnit(activeUnit)}
									>
										🗑️ Hapus
									</Button>
								</div>
							</div>

							{/* Rangkuman statistik unit */}
							<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-slate-100 pt-3 text-xs">
								<div className="rounded-xl bg-slate-50 p-2.5">
									<span className="text-ink-muted block text-[11px]">
										Pegawai di Unit Ini
									</span>
									<span className="text-base font-bold text-brand">
										{unitEmployees.length} Orang
									</span>
								</div>
								<div className="rounded-xl bg-slate-50 p-2.5">
									<span className="text-ink-muted block text-[11px]">
										Anak Unit Kerja
									</span>
									<span className="text-base font-bold text-ink">
										{childUnits.length} Unit
									</span>
								</div>
								<div className="rounded-xl bg-slate-50 p-2.5 col-span-2 sm:col-span-1">
									<span className="text-ink-muted block text-[11px]">
										Status Unit
									</span>
									<span className="text-base font-bold text-emerald-600">
										Aktif Operasional
									</span>
								</div>
							</div>
						</Card>

						{/* Unit Leaders */}
						<Card className="p-5">
							<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<h3 className="font-semibold text-base text-ink">
										Pimpinan Unit ({activeUnitLeaders.length})
									</h3>
									<p className="ui-sub">
										Daftar pimpinan yang bertanggung jawab atas unit ini.
									</p>
								</div>
								<Button
									className="text-xs py-1.5 px-3"
									onClick={() =>
										setLeaderModal({ open: true, unitId: activeUnit.id ?? "" })
									}
								>
									+ Tambah Pimpinan
								</Button>
							</div>
							{activeUnitLeaders.length ? (
								<TableWrap>
									<thead>
										<tr>
											<th>Nama Pimpinan</th>
											<th>Peran Pimpinan</th>
											<th className="text-right">Aksi</th>
										</tr>
									</thead>
									<tbody>
										{activeUnitLeaders.map((leader) => (
											<tr key={leader.userId}>
												<td>{leader.userName}</td>
												<td>{leader.leaderRole}</td>
												<td className="text-right">
													<Button
														variant="ghost"
														className="text-xs py-1 px-2.5 !text-rose-600 hover:!bg-rose-50"
														onClick={() => void handleDeleteLeader(leader)}
													>
														Hapus
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</TableWrap>
							) : (
								<div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
									<p className="text-sm font-medium text-ink">
										Belum ada pimpinan yang ditetapkan untuk unit ini.
									</p>
								</div>
							)}
						</Card>

						{/* Daftar Pegawai Terdaftar di Unit Ini */}
						<Card className="p-5">
							<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<h3 className="font-semibold text-base text-ink">
										Daftar Pegawai Terdaftar ({unitEmployees.length})
									</h3>
									<p className="ui-sub">
										Pegawai yang ditempatkan secara struktural di unit kerja
										ini.
									</p>
								</div>
								<input
									className="ui-input sm:w-56 mt-0 text-xs py-1.5"
									placeholder="Cari pegawai di unit ini…"
									value={searchUser}
									onChange={(e) => setSearchUser(e.target.value)}
								/>
							</div>

							{unitEmployees.length ? (
								<TableWrap>
									<thead>
										<tr>
											<th>Nama & NIP</th>
											<th>Jabatan</th>
											<th>Peran</th>
											<th className="text-right">Aksi</th>
										</tr>
									</thead>
									<tbody>
										{unitEmployees.map((emp) => (
											<tr key={emp.id}>
												<td>
													<div className="font-semibold text-ink text-xs sm:text-sm">
														{emp.fullName}
													</div>
													<div className="text-[11px] text-ink-muted font-mono">
														{emp.nip ?? "NIP Belum Terdaftar"}
													</div>
													<div className="text-[11px] text-ink-faint">
														{emp.email}
													</div>
												</td>
												<td className="text-xs text-ink max-w-[140px] truncate">
													{emp.jabatan || "-"}
												</td>
												<td>
													<div className="flex flex-wrap gap-1">
														{emp.roles.map((r) => (
															<span
																key={r}
																className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-ink"
															>
																{r}
															</span>
														))}
													</div>
												</td>
												<td className="text-right">
													<Button
														variant="ghost"
														className="text-xs py-1 px-2.5 text-brand hover:bg-brand-light"
														onClick={() => {
															setMoveModal({ open: true, user: emp });
															setTargetUnitId(emp.unitId ?? "");
														}}
													>
														Pindah Unit
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</TableWrap>
							) : (
								<div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
									<p className="text-sm font-medium text-ink">
										Belum ada pegawai yang ditempatkan di unit ini.
									</p>
									<p className="text-xs text-ink-muted mt-1">
										Pegawai dapat ditambahkan melalui Import Excel pada tab
										Periode, atau dipindahkan dari unit lain.
									</p>
								</div>
							)}
						</Card>

						{/* Anak Unit Binaan */}
						{childUnits.length > 0 && (
							<Card className="p-5">
								<h3 className="font-semibold text-sm text-ink mb-2">
									Anak Unit Kerja di Bawah {activeUnit.name} (
									{childUnits.length})
								</h3>
								<div className="grid gap-2 sm:grid-cols-2">
									{childUnits.map((ch) => {
										const cCount = directCounts.get(ch.id) ?? 0;
										return (
											<button
												key={ch.id}
												type="button"
												onClick={() => setSelectedUnitId(ch.id)}
												className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-900/5 hover:bg-slate-100 transition-all text-xs"
											>
												<div>
													<span className="font-bold text-brand">
														{ch.code}
													</span>
													<div className="font-medium text-ink mt-0.5">
														{ch.name}
													</div>
												</div>
												<span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink-muted ring-1 ring-slate-200">
													{cCount} Pegawai
												</span>
											</button>
										);
									})}
								</div>
							</Card>
						)}
					</>
				) : (
					<Card className="p-8 text-center text-ink-muted">
						Pilih unit kerja di sebelah kiri untuk melihat rincian.
					</Card>
				)}
			</div>

			{/* ==================== MODAL TAMBAH / EDIT UNIT ==================== */}
			{unitModal.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<form
						onSubmit={(e) => void handleSaveUnit(e)}
						className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift space-y-4"
					>
						<h3 className="font-bold text-base text-ink">
							{unitModal.mode === "create"
								? "Tambah Unit Organisasi Baru"
								: "Edit Unit Organisasi"}
						</h3>

						<div className="space-y-3">
							<Field label="Kode Unit">
								<input
									className="ui-input uppercase font-mono mt-1"
									required
									placeholder="Contoh: BRO-OSDM atau TK-KIN"
									value={unitForm.code}
									onChange={(e) =>
										setUnitForm({ ...unitForm, code: e.target.value })
									}
								/>
							</Field>

							<Field label="Nama Unit Organisasi">
								<input
									className="ui-input mt-1"
									required
									placeholder="Contoh: Tim Kerja Pengelolaan Kinerja Pegawai ASN"
									value={unitForm.name}
									onChange={(e) =>
										setUnitForm({ ...unitForm, name: e.target.value })
									}
								/>
							</Field>

							<Field label="Tingkat / Level Struktur">
								<select
									className="ui-input mt-1"
									value={unitForm.level}
									onChange={(e) =>
										setUnitForm({
											...unitForm,
											level: e.target.value as UnitLevel,
										})
									}
								>
									{Object.values(UnitLevel).map((level) => (
										<option key={level} value={level}>
											{UnitLevelDisplayNames[level]}
										</option>
									))}
								</select>
							</Field>

							<Field label="Unit Induk (Parent Unit)">
								<select
									className="ui-input mt-1"
									value={unitForm.parentUnitId}
									onChange={(e) =>
										setUnitForm({ ...unitForm, parentUnitId: e.target.value })
									}
								>
									<option value="">
										-- Tanpa Induk (Unit Tertinggi / Top Level) --
									</option>
									{units
										.filter((u) => u.id !== unitModal.data?.id)
										.map((u) => (
											<option key={u.id} value={u.id}>
												{u.name} ({u.code})
											</option>
										))}
								</select>
							</Field>
						</div>

						<div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setUnitModal({ open: false, mode: "create" })}
							>
								Batal
							</Button>
							<Button type="submit">
								{unitModal.mode === "create" ? "Simpan Unit" : "Perbarui Unit"}
							</Button>
						</div>
					</form>
				</div>
			)}

			{/* ==================== MODAL PINDAH UNIT PEGAWAI ==================== */}
			{moveModal.open && moveModal.user && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<form
						onSubmit={(e) => void handleMoveEmployee(e)}
						className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift space-y-4"
					>
						<h3 className="font-bold text-base text-ink">
							Pindahkan Pegawai ke Unit Lain
						</h3>
						<p className="text-xs text-ink-muted">
							Pindahkan penempatan struktural{" "}
							<strong className="text-ink">{moveModal.user.fullName}</strong> ke
							unit kerja baru.
						</p>

						<Field label="Pilih Unit Kerja Tujuan">
							<select
								className="ui-input mt-1"
								required
								value={targetUnitId}
								onChange={(e) => setTargetUnitId(e.target.value)}
							>
								<option value="">-- Pilih Unit Kerja --</option>
								{units.map((u) => (
									<option key={u.id} value={u.id}>
										{u.name} ({u.code})
									</option>
								))}
							</select>
						</Field>

						<div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setMoveModal({ open: false })}
							>
								Batal
							</Button>
							<Button type="submit">Simpan Perpindahan</Button>
						</div>
					</form>
				</div>
			)}

			{/* ==================== MODAL TAMBAH PIMPINAN UNIT ==================== */}
			{leaderModal.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<form
						onSubmit={(e) => void handleSaveLeader(e)}
						className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift space-y-4"
					>
						<h3 className="font-bold text-base text-ink">
							Tambah Pimpinan Unit
						</h3>
						<p className="text-xs text-ink-muted">
							Pilih pegawai dan tentukan peran pimpinannya untuk unit{" "}
							<strong className="text-ink">
								{units.find((u) => u.id === leaderModal.unitId)?.name}
							</strong>
							.
						</p>

						<Field label="Pilih Pegawai">
							<PersonSelect
								users={users.filter(
									(u) => !activeUnitLeaders.some((l) => l.userId === u.id),
								)}
								value={leaderModal.userId ?? ""}
								onChange={(id) =>
									setLeaderModal((prev) => ({ ...prev, userId: id }))
								}
								placeholder="Cari pegawai…"
							/>
						</Field>

						<Field label="Peran Pimpinan">
							<select
								className="ui-input mt-1"
								required
								value={leaderModal.leaderRole ?? ""}
								onChange={(e) =>
									setLeaderModal((prev) => ({
										...prev,
										leaderRole: e.target.value,
									}))
								}
							>
								<option value="">-- Pilih Peran --</option>
								<option value="eselon_1_leader">Pimpinan Unit Eselon 1</option>
								<option value="unit_kerja_leader">Pimpinan Unit Kerja</option>
								<option value="tim_kerja_leader">Ketua Tim Kerja</option>
							</select>
						</Field>

						<div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setLeaderModal({ open: false, unitId: "" })}
							>
								Batal
							</Button>
							<Button type="submit">Simpan Pimpinan</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

// ============================================================================
// TAB 3: PENUGASAN ATASAN
// ============================================================================

function Atasan() {
	const toast = useToast();
	const [periods, setPeriods] = useState<Period[]>([]);
	const [sel, setSel] = useState("");
	const [assigns, setAssigns] = useState<Assignment[]>([]);
	const [users, setUsers] = useState<UserRow[]>([]);
	const [q, setQ] = useState("");
	const [filterMode, setFilterMode] = useState<
		"all" | "missing" | "pending" | "submitted"
	>("all");
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		void (async () => {
			const [p, u] = await Promise.all([api.periods(), api.users()]);
			setPeriods(p.data);
			setUsers(u.data);
			const active = p.data.find((x) => x.status === "active") ?? p.data[0];
			if (active) setSel(active.id);
		})();
	}, []);

	useEffect(() => {
		if (!sel) return;
		void api.assignments(sel).then((r) => setAssigns(r.data));
	}, [sel]);

	const filtered = useMemo(() => {
		const s = q.trim().toLowerCase();
		return assigns.filter((a) => {
			if (filterMode === "missing" && a.assessorId) return false;
			if (filterMode === "pending" && a.status !== "pending") return false;
			if (
				filterMode === "submitted" &&
				a.status !== "submitted" &&
				a.status !== "revised"
			)
				return false;
			if (!s) return true;
			const hay =
				`${a.employeeName ?? ""} ${a.employeeNip ?? ""} ${a.assessorName ?? ""} ${a.unitName ?? ""}`.toLowerCase();
			return hay.includes(s);
		});
	}, [assigns, q, filterMode]);

	async function changeAtasan(a: Assignment, assessorId: string) {
		if (assessorId === (a.assessorId ?? "")) return;
		setBusyId(a.id);
		try {
			await api.patchAssignment(a.id, assessorId);
			setAssigns((await api.assignments(sel)).data);
			const name = users.find((u) => u.id === assessorId)?.fullName;
			toast.push(
				assessorId
					? `Atasan ${a.employeeName} diubah ke ${name}`
					: `Atasan ${a.employeeName} dilepas`,
			);
		} catch (e) {
			toast.push((e as Error).message, "error");
		} finally {
			setBusyId(null);
		}
	}

	const missingCount = assigns.filter((a) => !a.assessorId).length;
	const pendingCount = assigns.filter((a) => a.status === "pending").length;
	const doneCount = assigns.filter(
		(a) => a.status === "submitted" || a.status === "revised",
	).length;

	return (
		<Card>
			<div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h2 className="font-semibold text-base">Penugasan Pejabat Penilai</h2>
					<p className="ui-sub">
						Atasan otomatis menerima peran Penilai. Pegawai tidak boleh menilai
						dirinya sendiri.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<label className="ui-label sm:w-52">
						Periode
						<select
							className="ui-input mt-1"
							value={sel}
							onChange={(e) => setSel(e.target.value)}
						>
							{periods.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} {p.status === "active" ? "(Aktif)" : ""}
								</option>
							))}
						</select>
					</label>
					<label className="ui-label sm:w-60">
						Cari Pegawai / Atasan
						<input
							className="ui-input mt-1"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="Nama, NIP, atau Unit"
						/>
					</label>
				</div>
			</div>

			{/* Filter Status Pills */}
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<button
					type="button"
					className={`ui-role ${filterMode === "all" ? "ui-role-on" : "ui-role-off"}`}
					onClick={() => setFilterMode("all")}
				>
					Semua ({assigns.length})
				</button>
				<button
					type="button"
					className={`ui-role ${filterMode === "missing" ? "ui-role-on bg-amber-600 text-white" : "ui-role-off text-amber-800"}`}
					onClick={() => setFilterMode("missing")}
				>
					⚠️ Belum Ada Penilai ({missingCount})
				</button>
				<button
					type="button"
					className={`ui-role ${filterMode === "pending" ? "ui-role-on" : "ui-role-off"}`}
					onClick={() => setFilterMode("pending")}
				>
					⏳ Menunggu ({pendingCount})
				</button>
				<button
					type="button"
					className={`ui-role ${filterMode === "submitted" ? "ui-role-on bg-emerald-600 text-white" : "ui-role-off text-emerald-800"}`}
					onClick={() => setFilterMode("submitted")}
				>
					✅ Selesai ({doneCount})
				</button>
			</div>

			<AssignmentRows
				assigns={filtered}
				users={users}
				busyId={busyId}
				onChange={changeAtasan}
			/>
			{!filtered.length && (
				<p className="mt-4 text-center text-sm text-ink-muted py-6">
					Tidak ada data pegawai yang sesuai dengan filter pencarian.
				</p>
			)}
		</Card>
	);
}

function AssignmentRows({
	assigns,
	users,
	busyId,
	onChange,
}: {
	assigns: Assignment[];
	users: UserRow[];
	busyId: string | null;
	onChange: (a: Assignment, assessorId: string) => void;
}) {
	return (
		<TableWrap>
			<thead>
				<tr>
					<th>Pegawai</th>
					<th>Pejabat Penilai (Atasan)</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{assigns.map((a) => (
					<tr key={a.id}>
						<td>
							<div className="font-semibold text-ink">{a.employeeName}</div>
							<div className="text-xs text-ink-muted">
								{[a.employeeNip, a.employeeJabatan, a.unitName]
									.filter(Boolean)
									.join(" · ")}
							</div>
						</td>
						<td className="w-80">
							<PersonSelect
								users={users}
								value={a.assessorId ?? ""}
								excludeId={a.employeeId}
								disabled={busyId === a.id}
								onChange={(id) => onChange(a, id)}
							/>
						</td>
						<td>
							<Badge status={a.status} />
						</td>
					</tr>
				))}
			</tbody>
		</TableWrap>
	);
}

// ============================================================================
// TAB 4: PENGGUNA & PERAN
// ============================================================================

function Users() {
	const toast = useToast();
	const { user: me, refresh } = useAuth();
	const [users, setUsers] = useState<UserRow[]>([]);
	const [q, setQ] = useState("");
	const [busyId, setBusyId] = useState<string | null>(null);
	const [resetTarget, setResetTarget] = useState<UserRow | null>(null);

	async function load() {
		setUsers((await api.users()).data);
	}
	useEffect(() => {
		void load();
	}, []);

	const filtered = useMemo(() => {
		const s = q.trim().toLowerCase();
		if (!s) return users;
		return users.filter(
			(u) =>
				u.fullName.toLowerCase().includes(s) ||
				u.email.toLowerCase().includes(s) ||
				(u.nip ?? "").includes(s) ||
				(u.unitName ?? "").toLowerCase().includes(s),
		);
	}, [users, q]);

	async function toggleRole(u: UserRow, role: Role) {
		if (role === "employee") return;
		const next = u.roles.includes(role)
			? u.roles.filter((r) => r !== role)
			: [...u.roles, role];
		if (!next.includes("employee")) next.push("employee");
		setBusyId(u.id);
		try {
			const res = await api.setUserRoles(u.id, next as Role[]);
			setUsers((list) =>
				list.map((row) =>
					row.id === u.id ? { ...row, roles: res.roles } : row,
				),
			);
			toast.push(`Peran ${u.fullName} berhasil diperbarui`);
			if (me?.id === u.id) await refresh();
		} catch (e) {
			toast.push((e as Error).message, "error");
		} finally {
			setBusyId(null);
		}
	}

	async function confirmResetPassword() {
		if (!resetTarget) return;
		try {
			const r = await api.resetPassword(resetTarget.id);
			toast.push(
				`Password ${resetTarget.fullName} direset ke ${r.defaultPassword ?? r.temporaryPassword}`,
			);
			setResetTarget(null);
		} catch (e) {
			toast.push((e as Error).message, "error");
		}
	}

	return (
		<Card>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="font-semibold text-base">
						Manajemen Pengguna & Multi-Peran
					</h2>
					<p className="ui-sub">
						Klik badge peran untuk mengaktifkan atau menonaktifkan peran
						pengguna. Peran Pegawai selalu aktif.
					</p>
				</div>
				<label className="ui-label sm:w-72">
					Cari Pengguna
					<input
						className="ui-input mt-1"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Nama, email, NIP, unit"
					/>
				</label>
			</div>

			<TableWrap>
				<thead>
					<tr>
						<th>Profil Pegawai</th>
						<th>Peran Aktif</th>
						<th className="text-right">Aksi Keamanan</th>
					</tr>
				</thead>
				<tbody>
					{filtered.map((u) => (
						<tr key={u.id}>
							<td>
								<div className="font-semibold text-ink">{u.fullName}</div>
								<div className="text-xs text-ink-muted">
									{u.email} · NIP: {u.nip ?? "-"}
								</div>
								{u.unitName ? (
									<div className="text-[11px] text-brand font-medium mt-0.5">
										{u.unitName}
									</div>
								) : null}
							</td>
							<td>
								<RoleToggles
									roles={u.roles}
									disabled={busyId === u.id}
									onToggle={(role) => void toggleRole(u, role)}
								/>
							</td>
							<td className="text-right">
								<Button
									variant="ghost"
									className="text-xs py-1 px-2.5 text-rose-700 hover:bg-rose-50"
									onClick={() => setResetTarget(u)}
								>
									Reset Password
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</TableWrap>

			{/* Modal Dialog Konfirmasi Reset Password */}
			{resetTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift space-y-4">
						<h3 className="font-semibold text-base text-ink">
							Konfirmasi Reset Password
						</h3>
						<p className="text-sm text-ink-muted leading-relaxed">
							Apakah Anda yakin ingin mereset password untuk akun{" "}
							<strong className="text-ink">{resetTarget.fullName}</strong> (
							{resetTarget.email})? Password akan dikembalikan ke default{" "}
							<code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
								Password1
							</code>{" "}
							dan pengguna wajib menggantinya saat login.
						</p>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="ghost"
								onClick={() => setResetTarget(null)}
								className="text-xs"
							>
								Batal
							</Button>
							<Button
								onClick={() => void confirmResetPassword()}
								className="text-xs !bg-rose-600 hover:!bg-rose-700"
							>
								Ya, Reset Password
							</Button>
						</div>
					</div>
				</div>
			)}
		</Card>
	);
}

const ROLE_OPTIONS: Array<{
	id: Role;
	label: string;
	hint: string;
	locked?: boolean;
}> = [
	{
		id: "employee",
		label: "Pegawai",
		hint: "Melihat hasil penilaian sendiri",
		locked: true,
	},
	{ id: "assessor", label: "Penilai", hint: "Menilai pegawai binaan" },
	{ id: "leadership", label: "Pimpinan", hint: "Melihat laporan agregat unit" },
	{ id: "admin", label: "Admin", hint: "Mengelola sistem dan master data" },
];

function RoleToggles({
	roles,
	disabled,
	onToggle,
}: {
	roles: string[];
	disabled: boolean;
	onToggle: (role: Role) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{ROLE_OPTIONS.map((opt) => {
				const on = roles.includes(opt.id);
				return (
					<button
						key={opt.id}
						type="button"
						title={opt.hint}
						disabled={disabled || opt.locked}
						className={`ui-role text-xs px-2.5 py-1 ${on ? "ui-role-on shadow-xs" : "ui-role-off"}`}
						aria-pressed={on}
						onClick={() => onToggle(opt.id)}
					>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}

// ============================================================================
// TAB 5: MASTER DATA BERAKHLAK (SUB-TABS 7 NILAI)
// ============================================================================

function Master() {
	const toast = useToast();
	const [data, setData] = useState<MasterPayload | null>(null);
	const [activeCode, setActiveCode] = useState<string>("ND-01-BP");

	useEffect(() => {
		void api.master().then(setData);
	}, []);

	if (!data)
		return (
			<p className="text-ink-muted text-sm py-4">
				Memuat master data BerAKHLAK…
			</p>
		);

	const currentNilai =
		data.nilaiDasar.find((n) => n.code === activeCode) ?? data.nilaiDasar[0];

	return (
		<div className="space-y-4">
			{/* Sub-Tabs 7 Nilai Dasar */}
			<div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-surface">
				{data.nilaiDasar.map((n) => {
					const active = n.code === activeCode;
					return (
						<button
							key={n.id}
							type="button"
							onClick={() => setActiveCode(n.code)}
							className={`ui-tab py-2 px-3 text-xs font-medium rounded-xl transition-all ${
								active
									? "bg-brand text-white shadow-xs"
									: "text-ink-muted hover:bg-slate-50"
							}`}
						>
							<span className="font-semibold">{n.code}</span>
							<span className="block truncate text-[10px] opacity-90">
								{n.name}
							</span>
						</button>
					);
				})}
			</div>

			{currentNilai && (
				<Card>
					<div className="border-b border-slate-100 pb-4 mb-4">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-xs font-bold text-brand uppercase tracking-wider">
									{currentNilai.code}
								</span>
								<h3 className="text-lg font-bold text-ink">
									{currentNilai.name}
								</h3>
							</div>
							<span className="text-[11px] text-ink-faint">
								Perubahan disimpan otomatis (saat kursor keluar field)
							</span>
						</div>

						{/* Definisi Nilai */}
						<label className="ui-label mt-3">
							Definisi & Makna Nilai
							<textarea
								className="ui-input min-h-[3.5rem] mt-1"
								defaultValue={currentNilai.description}
								onBlur={(e) => {
									if (e.target.value === currentNilai.description) return;
									void api
										.patchNilai(currentNilai.id, {
											name: currentNilai.name,
											description: e.target.value,
										})
										.then(() =>
											toast.push(`Definisi ${currentNilai.name} tersimpan`),
										)
										.catch((err) =>
											toast.push((err as Error).message, "error"),
										);
								}}
							/>
						</label>
					</div>

					{/* Grid Side-by-Side: Jangkar BARS vs Feedback Template */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Kolom Kiri: Jangkar BARS Level 1-5 */}
						<div className="space-y-3">
							<h4 className="font-semibold text-xs uppercase tracking-wider text-ink-muted">
								🎯 Jangkar Perilaku BARS (Level 1–5)
							</h4>
							{data.anchors
								.filter((a) => a.nilaiDasarId === currentNilai.id)
								.sort((a, b) => a.level - b.level)
								.map((a) => (
									<label
										key={a.id}
										className="ui-label block rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5"
									>
										<span className="font-medium text-xs text-brand">
											Level {a.level}
										</span>
										<textarea
											className="ui-input min-h-[4.5rem] mt-1 text-xs"
											defaultValue={a.anchorText}
											onBlur={(e) => {
												if (e.target.value === a.anchorText) return;
												void api
													.patchAnchor(a.id, e.target.value)
													.then(() =>
														toast.push(
															`Jangkar L${a.level} ${currentNilai.name} disimpan`,
														),
													)
													.catch((err) =>
														toast.push((err as Error).message, "error"),
													);
											}}
										/>
									</label>
								))}
						</div>

						{/* Kolom Kanan: Template Feedback Level 1-5 */}
						<div className="space-y-3">
							<h4 className="font-semibold text-xs uppercase tracking-wider text-ink-muted">
								💬 Template Umpan Balik Rekomendasi (Level 1–5)
							</h4>
							{data.feedbackTemplates
								.filter((f) => f.nilaiDasarId === currentNilai.id)
								.sort((a, b) => a.level - b.level)
								.map((f) => (
									<label
										key={f.id}
										className="ui-label block rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5"
									>
										<span className="font-medium text-xs text-brand">
											Feedback Level {f.level}
										</span>
										<textarea
											className="ui-input min-h-[4.5rem] mt-1 text-xs"
											defaultValue={f.templateText}
											placeholder="(Kosongkan jika tidak ada template khusus)"
											onBlur={(e) => {
												if (e.target.value === f.templateText) return;
												void api
													.patchFeedback(f.id, e.target.value)
													.then(() =>
														toast.push(
															`Feedback L${f.level} ${currentNilai.name} disimpan`,
														),
													)
													.catch((err) =>
														toast.push((err as Error).message, "error"),
													);
											}}
										/>
									</label>
								))}
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}

// ============================================================================
// TAB 6: LOG AUDIT
// ============================================================================

function Audit() {
	const [data, setData] = useState<{
		assessments: unknown[];
		master: unknown[];
	} | null>(null);
	const [auditTab, setAuditTab] = useState<"assessments" | "master" | "json">(
		"assessments",
	);

	useEffect(() => {
		void api.audit().then(setData);
	}, []);

	if (!data)
		return <p className="text-ink-muted text-sm py-4">Memuat log audit…</p>;

	const assessmentLogs = (data.assessments ?? []) as Array<{
		id: string;
		assessmentId: string;
		action: string;
		changedBy: string;
		changeDetails?: string;
		ipAddress?: string;
		createdAt: number;
	}>;

	const masterLogs = (data.master ?? []) as Array<{
		id: string;
		tableName: string;
		recordId: string;
		action: string;
		changedFields?: string;
		changedBy: string;
		changedAt: number;
	}>;

	return (
		<Card>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-semibold text-base">
						Jejak Audit & Riwayat Perubahan
					</h2>
					<p className="ui-sub">
						Rekaman lengkap setiap aksi penilaian, perubahan atasan, dan
						pengubahan master data.
					</p>
				</div>

				{/* Audit sub-tab toggle */}
				<div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs">
					<button
						type="button"
						className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
							auditTab === "assessments"
								? "bg-white text-ink shadow-xs"
								: "text-ink-muted hover:text-ink"
						}`}
						onClick={() => setAuditTab("assessments")}
					>
						Penilaian ({assessmentLogs.length})
					</button>
					<button
						type="button"
						className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
							auditTab === "master"
								? "bg-white text-ink shadow-xs"
								: "text-ink-muted hover:text-ink"
						}`}
						onClick={() => setAuditTab("master")}
					>
						Master Data ({masterLogs.length})
					</button>
					<button
						type="button"
						className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
							auditTab === "json"
								? "bg-white text-ink shadow-xs"
								: "text-ink-muted hover:text-ink"
						}`}
						onClick={() => setAuditTab("json")}
					>
						Raw JSON
					</button>
				</div>
			</div>

			{auditTab === "assessments" && (
				<TableWrap>
					<thead>
						<tr>
							<th>Waktu</th>
							<th>Aksi</th>
							<th>Pelaku</th>
							<th>Detail Aksi</th>
						</tr>
					</thead>
					<tbody>
						{assessmentLogs.length ? (
							assessmentLogs.map((log) => (
								<tr key={log.id}>
									<td className="text-xs whitespace-nowrap text-ink-muted">
										{formatEpochFull(log.createdAt)}
									</td>
									<td>
										<span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-brand">
											{log.action}
										</span>
									</td>
									<td className="text-xs font-medium text-ink">
										{log.changedBy}
										{log.ipAddress ? (
											<span className="block text-[10px] text-ink-faint">
												{log.ipAddress}
											</span>
										) : null}
									</td>
									<td className="text-xs text-ink-muted max-w-md">
										{log.changeDetails || "-"}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={4}
									className="text-center text-sm text-ink-muted py-6"
								>
									Belum ada rekaman riwayat penilaian.
								</td>
							</tr>
						)}
					</tbody>
				</TableWrap>
			)}

			{auditTab === "master" && (
				<TableWrap>
					<thead>
						<tr>
							<th>Waktu</th>
							<th>Tabel</th>
							<th>Aksi</th>
							<th>Pelaku</th>
							<th>Perubahan Field</th>
						</tr>
					</thead>
					<tbody>
						{masterLogs.length ? (
							masterLogs.map((log) => (
								<tr key={log.id}>
									<td className="text-xs whitespace-nowrap text-ink-muted">
										{formatEpochFull(log.changedAt)}
									</td>
									<td className="text-xs font-mono font-medium text-ink">
										{log.tableName}
									</td>
									<td>
										<span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
											{log.action}
										</span>
									</td>
									<td className="text-xs text-ink">{log.changedBy}</td>
									<td className="text-xs text-ink-muted font-mono max-w-md truncate">
										{log.changedFields || "-"}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={5}
									className="text-center text-sm text-ink-muted py-6"
								>
									Belum ada rekaman perubahan master data.
								</td>
							</tr>
						)}
					</tbody>
				</TableWrap>
			)}

			{auditTab === "json" && (
				<pre className="max-h-[60vh] overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400">
					{JSON.stringify(data, null, 2)}
				</pre>
			)}
		</Card>
	);
}
