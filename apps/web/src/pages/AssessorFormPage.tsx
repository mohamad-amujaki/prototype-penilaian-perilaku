/**
 * AssessorFormPage.tsx — Formulir Penilaian Perilaku Kerja
 *
 * Halaman utama penilai untuk mengisi formulir penilaian.
 *
 * Alur penggunaan:
 * 1. Pilih level BARS (1-5) untuk setiap nilai dasar BerAKHLAK
 * 2. Edit teks umpan balik (opsional)
 * 3. Pilih apakah umpan balik ditampilkan ke pegawai
 * 4. Navigasi antar tab nilai dasar
 * 5. Lihat ringkasan skor di tab Ringkasan
 * 6. Centang konfirmasi kejujuran
 * 7. Simpan draft atau submit
 *
 * Fitur:
 * - 7 tab nilai dasar + 1 tab Ringkasan
 * - Auto-save template feedback berdasarkan level yang dipilih
 * - Validasi: semua 7 nilai harus dipilih sebelum submit
 * - Preview skor real-time di tab Ringkasan
 */

import { ID_TO_CODE, NILAI_CODES, type NilaiCode } from "@app/shared";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScorePreview } from "../App";
import { api, type MasterPayload } from "../api";
import { Banner, Button, Card, PageHeader } from "../components/ui";
import { useToast } from "../toast";

/** Skor awal: semua nilai = 0 (belum dipilih) */
const emptyScores = Object.fromEntries(
	NILAI_CODES.map((c) => [c, 0]),
) as Record<string, number>;

export function AssessorFormPage() {
	const { assignmentId } = useParams();
	const nav = useNavigate();
	const toast = useToast();
	const [master, setMaster] = useState<MasterPayload | null>(null);
	const [name, setName] = useState("");
	const [scores, setScores] = useState<Record<string, number>>(emptyScores);
	const [texts, setTexts] = useState<Record<string, string>>({});
	const [show, setShow] = useState<Record<string, boolean>>({});
	const [agree, setAgree] = useState(false);
	const [msg, setMsg] = useState("");
	const [tab, setTab] = useState<NilaiCode>("ND-01-BP");
	const [step, setStep] = useState<"nilai" | "ringkasan">("nilai");

	useEffect(() => {
		if (!assignmentId) return;
		void Promise.all([api.master(), api.assessorForm(assignmentId)]).then(
			([m, f]) => {
				setMaster(m);
				setName(f.employee?.fullName ?? "");
				if (f.assessment) {
					setScores(f.assessment.scores);
					const t: Record<string, string> = {};
					const s: Record<string, boolean> = {};
					for (const fb of f.assessment.feedbacks) {
						t[fb.nilaiDasarCode] = fb.feedbackText;
						s[fb.nilaiDasarCode] = true;
					}
					setTexts(t);
					setShow(s);
					const firstOpen = NILAI_CODES.find((c) => !f.assessment?.scores[c]);
					if (firstOpen) setTab(firstOpen);
					else setStep("ringkasan");
				}
			},
		);
	}, [assignmentId]);

	const templates = useMemo(() => {
		const map: Record<string, Record<number, string>> = {};
		if (!master) return map;
		for (const f of master.feedbackTemplates) {
			const code = ID_TO_CODE[f.nilaiDasarId];
			if (!code) continue;
			map[code] ??= {};
			map[code][f.level] = f.templateText;
		}
		return map;
	}, [master]);

	const doneCount = NILAI_CODES.filter((c) => scores[c] > 0).length;
	const tabIndex = NILAI_CODES.indexOf(tab);
	const allDone = doneCount === NILAI_CODES.length;

	function goTab(code: NilaiCode) {
		setStep("nilai");
		setTab(code);
	}

	function setLevel(code: string, level: number) {
		setScores({ ...scores, [code]: level });
		setTexts({ ...texts, [code]: templates[code]?.[level] ?? "" });
		setShow({ ...show, [code]: show[code] !== false });
	}

	function openRingkasan() {
		if (!allDone) {
			const firstOpen = NILAI_CODES.find((c) => scores[c] < 1);
			if (firstOpen) setTab(firstOpen);
			setStep("nilai");
			return;
		}
		setStep("ringkasan");
	}

	function next() {
		if (tabIndex < NILAI_CODES.length - 1) {
			setTab(NILAI_CODES[tabIndex + 1]);
			return;
		}
		openRingkasan();
	}

	function prev() {
		if (step === "ringkasan") {
			setStep("nilai");
			setTab(NILAI_CODES[NILAI_CODES.length - 1]);
			return;
		}
		if (tabIndex > 0) setTab(NILAI_CODES[tabIndex - 1]);
	}

	async function save(action: "draft" | "submit") {
		if (action === "submit" && !agree) {
			setMsg("Centang konfirmasi dulu");
			openRingkasan();
			return;
		}
		setMsg("");
		try {
			await api.saveAssessment({
				assignmentId,
				action,
				scores,
				additionalFeedback: "",
				feedbacks: NILAI_CODES.map((c) => ({
					nilaiDasarCode: c,
					finalText: (texts[c] ?? "").slice(0, 300),
					includeForEmployee: show[c] !== false,
				})),
			});
			toast.push(
				action === "submit" ? "Penilaian dikirim" : "Draf penilaian disimpan",
			);
			nav("/penilai");
		} catch (e) {
			setMsg((e as Error).message);
		}
	}

	if (!master) return <p className="text-ink-muted">Memuat…</p>;

	const current = master.nilaiDasar.find(
		(n) => (ID_TO_CODE[n.id] ?? n.code) === tab,
	);
	const panduan = current
		? master.panduan.filter((p) => p.nilaiDasarId === current.id)
		: [];
	const anchors = current
		? master.anchors
				.filter((a) => a.nilaiDasarId === current.id)
				.sort((a, b) => a.level - b.level)
		: [];

	return (
		<div className="pb-4">
			<Link to="/penilai" className="ui-btn-quiet inline-flex">
				← Kembali
			</Link>
			<PageHeader
				title={`Penilaian Perilaku Kerja Pegawai a.n. ${name}`}
				sub={`${doneCount} dari 7 nilai dasar sudah dipilih. Satu tab = satu nilai BerAKHLAK.`}
			/>

			<div className="sticky top-[3.25rem] z-10 mb-4">
				<div
					className="ui-tabs"
					role="tablist"
					aria-label="Nilai dasar BerAKHLAK"
				>
					{master.nilaiDasar.map((n) => {
						const code = ID_TO_CODE[n.id] ?? (n.code as NilaiCode);
						const active = step === "nilai" && tab === code;
						const done = scores[code] > 0;
						return (
							<button
								key={n.id}
								type="button"
								role="tab"
								aria-selected={active}
								className={`ui-tab ${active ? "ui-tab-active" : ""} ${done ? "ui-tab-done" : ""}`}
								onClick={() => goTab(code)}
								title={`${n.name}${done ? ` · Level ${scores[code]}` : ""}`}
							>
								{n.name}
								{done ? <span className="sr-only"> sudah dinilai</span> : null}
							</button>
						);
					})}
					<button
						type="button"
						role="tab"
						aria-selected={step === "ringkasan"}
						disabled={!allDone}
						className={`ui-tab ${step === "ringkasan" ? "ui-tab-active" : ""} ${allDone ? "ui-tab-done" : ""}`}
						onClick={() => openRingkasan()}
						title={
							allDone
								? "Ringkasan penilaian"
								: "Selesaikan ketujuh nilai dasar dulu"
						}
					>
						Ringkasan
					</button>
				</div>
			</div>

			{step === "ringkasan" ? (
				<div className="space-y-4">
					<ScorePreview scores={scores} />
					<Card>
						<label className="flex items-start gap-2.5 text-sm">
							<input
								type="checkbox"
								className="mt-0.5"
								checked={agree}
								onChange={(e) => setAgree(e.target.checked)}
							/>
							<span>Saya telah memberikan penilaian yang jujur dan adil</span>
						</label>
						{msg ? (
							<div className="mt-3">
								<Banner tone="error">{msg}</Banner>
							</div>
						) : null}
					</Card>
				</div>
			) : current ? (
				<Card>
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div>
							<h2 className="font-semibold text-brand">
								Nilai Dasar ASN - {current.name}
							</h2>
						</div>
						<span className="text-xs text-ink-faint">{tabIndex + 1} / 7</span>
					</div>
					{panduan.length ? (
						<ul className="mt-3 flex flex-wrap gap-1.5">
							{panduan.map((p) => (
								<li
									key={p.id}
									className="rounded-full bg-brand-light px-2.5 py-1 text-xs text-brand-dark"
								>
									{p.title}
								</li>
							))}
						</ul>
					) : null}
					<div className="mt-4 space-y-2">
						{anchors.map((a) => {
							const lv = master.barsLevels.find((b) => b.level === a.level);
							return (
								<label key={a.id} className="ui-radio">
									<input
										type="radio"
										className="mt-1"
										name={tab}
										checked={scores[tab] === a.level}
										onChange={() => setLevel(tab, a.level)}
									/>
									<span>
										<span className="font-medium">
											Level {a.level} — {lv?.name}
										</span>
										<span className="mt-1 block text-ink-muted">
											{a.anchorText}
										</span>
									</span>
								</label>
							);
						})}
					</div>
					{scores[tab] > 0 && (
						<div className="mt-4">
							<label className="ui-label">
								Umpan balik perilaku kerja pegawai ({(texts[tab] ?? "").length}
								/300 Karakter)
								<textarea
									className="ui-input min-h-[4.5rem]"
									maxLength={300}
									value={texts[tab] ?? ""}
									onChange={(e) =>
										setTexts({ ...texts, [tab]: e.target.value })
									}
								/>
							</label>
							<label className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
								<input
									type="checkbox"
									checked={show[tab] !== false}
									onChange={(e) =>
										setShow({ ...show, [tab]: e.target.checked })
									}
								/>
								Tampilkan ke pegawai
							</label>
						</div>
					)}
				</Card>
			) : null}

			<div className="ui-sticky-bar">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm text-ink-muted">
						{step === "nilai"
							? `${current?.name ?? ""} · ${doneCount}/7 dinilai`
							: `Ringkasan · ${doneCount}/7 dinilai`}
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="ghost"
							onClick={prev}
							disabled={step === "nilai" && tabIndex === 0}
						>
							Sebelumnya
						</Button>
						{step === "nilai" ? (
							<Button onClick={next} disabled={scores[tab] < 1}>
								{tabIndex === NILAI_CODES.length - 1
									? allDone
										? "Ke ringkasan"
										: "Nilai berikutnya"
									: "Nilai berikutnya"}
							</Button>
						) : (
							<>
								<Button variant="ghost" onClick={() => void save("draft")}>
									Simpan draft
								</Button>
								<Button
									onClick={() => void save("submit")}
									disabled={!allDone || !agree}
								>
									Simpan
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
