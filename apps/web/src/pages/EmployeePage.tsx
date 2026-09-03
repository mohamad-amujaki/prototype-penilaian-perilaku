/**
 * EmployeePage.tsx — Halaman Pegawai (Self-View)
 *
 * Halaman utama pegawai untuk melihat hasil penilaian mereka.
 *
 * Fitur:
 * - Info periode dan status penilaian
 * - Radar chart 3 dimensi budaya kerja
 * - Detail skor per nilai dasar dengan umpan balik
 * - Ringkasan: nilai kuat (level >= 4) dan perlu penguatan (level <= 2)
 * - Riwayat penilaian dari semua periode
 * - Navigasi tab: "Hasil penilaian" dan "Format BerAKHLAK"
 *
 * Data yang ditampilkan hanya assessment yang sudah disubmit (bukan draft).
 */

import { BARS_LEVELS, NILAI_DASAR, type NilaiCode } from "@app/shared";
import { useEffect, useMemo, useState } from "react";
import { type AssessmentView, api, type EmployeeDash } from "../api";
import { BudayaRadar } from "../components/BudayaRadar";
import { EmployeeSubnav } from "../components/EmployeeSubnav";
import { Banner, Card, PageHeader } from "../components/ui";

/** Tipe data untuk baris hasil penilaian per nilai dasar */
type NilaiRow = {
	code: NilaiCode; // Kode nilai (BP, AK, dst.)
	name: string; // Nama nilai dasar
	level: number; // Level BARS yang dipilih (1-5)
	score120: number; // Skor dalam skala 120
	feedbackText: string; // Teks umpan balik dari penilai
};

/** Mendapatkan metadata level BARS berdasarkan level */
function levelMeta(level: number) {
	return BARS_LEVELS.find((b) => b.level === level);
}

/** Menentukan warna chip berdasarkan level */
function chipTone(level: number) {
	if (level <= 2) return "ui-fb-chip-low"; // Merah/kuning untuk level rendah
	if (level >= 4) return "ui-fb-chip-high"; // Hijau untuk level tinggi
	return "ui-fb-chip-mid"; // Netral untuk level tengah
}

/**
 * Mengkonversi data AssessmentView menjadi array NilaiRow.
 * Digunakan untuk menampilkan hasil per nilai dasar.
 */
function rowsFromView(view: AssessmentView): NilaiRow[] {
	return NILAI_DASAR.map((n) => {
		const fb = view.feedbacks.find((f) => f.nilaiDasarCode === n.code);
		return {
			code: n.code,
			name: n.name,
			level: Number(view.scores[n.code] ?? fb?.level ?? 0),
			score120: Number(view.calculations.perNilai120[n.code] ?? 0),
			feedbackText: fb?.feedbackText?.trim() ?? "",
		};
	});
}

/**
 * Menentukan tab default: nilai dengan level terendah.
 * Ini memudahkan pegawai melihat area yang perlu diperkuat terlebih dahulu.
 */
function defaultTab(rows: NilaiRow[]) {
	const scored = rows.filter((r) => r.level > 0);
	if (!scored.length) return rows[0]?.code ?? "";
	const min = Math.min(...scored.map((r) => r.level));
	return scored.find((r) => r.level === min)?.code ?? rows[0].code;
}

export function EmployeePage() {
	const [dash, setDash] = useState<EmployeeDash | null>(null);
	const [hist, setHist] = useState<AssessmentView[]>([]);
	const [err, setErr] = useState("");
	const [histId, setHistId] = useState<string | null>(null);

	useEffect(() => {
		void api
			.employeeDash()
			.then((d) => {
				setDash(d);
				if (d.assessment?.id)
					setHistId((cur) => cur ?? d.assessment?.id ?? null);
			})
			.catch((e) => setErr((e as Error).message));
		void api
			.employeeHistory()
			.then((r) => setHist(r.data ?? []))
			.catch((e) => setErr((e as Error).message));
	}, []);

	const view = hist.find((h) => h.id === histId) ?? dash?.assessment ?? null;
	const periodLabel = view?.periodName ?? dash?.period?.name ?? "—";

	return (
		<div className="space-y-5">
			<EmployeeSubnav />
			<PageHeader
				title="Hasil penilaian"
				sub="Skor, radar budaya kerja, dan umpan balik dari pejabat penilai."
			/>
			{err ? <Banner tone="error">{err}</Banner> : null}
			<Card>
				<div className="text-xs font-medium uppercase tracking-wide text-ink-faint">
					Periode {periodLabel}
				</div>
				<div className="mt-1 text-lg font-semibold">
					{view
						? `Sudah dinilai · ${view.calculations.scoreScale120} (${view.calculations.kategoriNilaiPerilaku})`
						: dash?.assignment
							? "Belum ada hasil (masih draft atau belum dinilai)"
							: "Tidak ada assignment"}
				</div>
				<div className="mt-1 text-sm text-ink-muted">
					Penilai: {dash?.assessorName ?? "—"}
				</div>
			</Card>
			<Card>
				<h2 className="font-semibold">Profil budaya kerja</h2>
				<p className="ui-sub">Radar skala 0–120 untuk akun pegawai ini.</p>
				<BudayaRadar
					bk-01-ee={view?.calculations.budayaEksekusiEfektif ?? 0}
					bk-02-ck={view?.calculations.budayaCaraKerjaBaru ?? 0}
					bk-03-pu={view?.calculations.budayaPelayananUnggul ?? 0}
				/>
				{view ? (
					<ul className="space-y-1 text-sm text-ink-muted">
						<li>
							Eksekusi Efektif: {view.calculations.budayaEksekusiEfektif} (
							{view.calculations.kategoriEksekusiEfektif})
						</li>
						<li>
							Cara Kerja Baru: {view.calculations.budayaCaraKerjaBaru} (
							{view.calculations.kategoriCaraKerjaBaru})
						</li>
						<li>
							Pelayanan Unggul: {view.calculations.budayaPelayananUnggul} (
							{view.calculations.kategoriPelayananUnggul})
						</li>
					</ul>
				) : (
					<p className="text-sm text-ink-faint">
						Radar terisi setelah penilaian dikirim.
					</p>
				)}
			</Card>
			<NilaiHasilCard view={view} />
			<Card>
				<h2 className="font-semibold">Riwayat</h2>
				<ul className="mt-2 space-y-2 text-sm">
					{hist.map((h) => (
						<li key={h.id}>
							<button
								type="button"
								className={`flex w-full flex-wrap justify-between gap-2 border-t border-slate-100 py-2 text-left first:border-0 ${histId === h.id ? "font-medium text-brand" : ""}`}
								onClick={() => setHistId(h.id)}
							>
								<span>{h.periodName ?? h.id}</span>
								<span className="text-ink-muted">
									{h.calculations.scoreScale120} (
									{h.calculations.kategoriNilaiPerilaku})
								</span>
							</button>
						</li>
					))}
					{!hist.length && (
						<li className="text-ink-faint">Belum ada riwayat</li>
					)}
				</ul>
			</Card>
		</div>
	);
}

/**
 * NilaiHasilCard — Kartu detail hasil penilaian per nilai dasar.
 *
 * Menampilkan:
 * - Ringkasan nilai kuat dan perlu penguatan
 * - Tab navigasi untuk setiap nilai dasar
 * - Detail: level, nama level, skor 120, dan umpan balik
 */
function NilaiHasilCard({ view }: { view: AssessmentView | null }) {
	const rows = useMemo(() => (view ? rowsFromView(view) : []), [view]);
	const [tab, setTab] = useState<NilaiCode | "">("");

	// Set tab default saat view berubah
	useEffect(() => {
		setTab(defaultTab(rows));
	}, [view?.id, rows]);

	// Nilai kuat: level >= 4
	const strong = rows.filter((r) => r.level >= 4);
	// Nilai perlu penguatan: level 1-2
	const grow = rows.filter((r) => r.level > 0 && r.level <= 2);
	const current = rows.find((r) => r.code === tab) ?? rows[0];
	const lv =
		current && current.level > 0 ? levelMeta(current.level) : undefined;

	/** Membuat daftar nilai sebagai teks dengan tombol link */
	function summaryLinks(list: NilaiRow[]) {
		return list.map((r, idx) => (
			<span key={r.code}>
				{idx > 0
					? list.length === 2
						? " dan "
						: idx === list.length - 1
							? ", dan "
							: ", "
					: null}
				<button
					type="button"
					className="ui-btn-quiet !inline !px-0 !py-0"
					onClick={() => setTab(r.code)}
				>
					{r.name}
				</button>
			</span>
		));
	}

	return (
		<Card>
			<h2 className="font-semibold">Hasil per nilai dasar</h2>
			<p className="ui-sub">
				Level, skor, dan umpan balik penilai untuk setiap nilai BerAKHLAK.
			</p>
			{!view ? (
				<p className="mt-4 text-sm text-ink-muted">
					Hasil per nilai muncul setelah penilaian dikirim.
				</p>
			) : current ? (
				<>
					<div className="mt-4 space-y-1 text-sm">
						{grow.length ? (
							<p>
								<span className="font-medium text-ink">Perlu penguatan: </span>
								{summaryLinks(grow)}
							</p>
						) : null}
						{strong.length ? (
							<p>
								<span className="font-medium text-ink">Sudah kuat: </span>
								{summaryLinks(strong)}
							</p>
						) : null}
						{!grow.length && !strong.length ? (
							<p className="text-ink-muted">
								Seluruh nilai berada pada standar yang diharapkan.
							</p>
						) : null}
					</div>
					<div
						className="ui-tabs mt-4"
						role="tablist"
						aria-label="Nilai dasar BerAKHLAK"
					>
						{rows.map((r) => {
							const active = r.code === current.code;
							return (
								<button
									key={r.code}
									type="button"
									role="tab"
									aria-selected={active}
									className={`ui-tab ${active ? "ui-tab-active" : ""}`}
									onClick={() => setTab(r.code)}
								>
									{r.name}
								</button>
							);
						})}
					</div>
					<div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 shadow-[inset_0_0_0_1px_rgb(15_23_42/0.06)]">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="font-medium">{current.name}</h3>
							{current.level > 0 ? (
								<span className={`ui-fb-chip ${chipTone(current.level)}`}>
									Level {current.level}
									{lv ? ` · ${lv.name}` : ""}
								</span>
							) : (
								<span className="ui-fb-chip ui-fb-chip-mid">
									Belum ada level
								</span>
							)}
						</div>
						<p className="mt-2 text-sm text-ink-muted">
							Skor 120:{" "}
							<span className="font-medium text-ink">
								{current.score120 || "—"}
							</span>
						</p>
						{current.feedbackText ? (
							<p className="mt-2 text-sm leading-relaxed text-ink-muted">
								{current.feedbackText}
							</p>
						) : (
							<p className="mt-2 text-sm text-ink-faint">
								Penilai tidak menampilkan umpan balik untuk nilai ini.
							</p>
						)}
					</div>
				</>
			) : null}
		</Card>
	);
}
