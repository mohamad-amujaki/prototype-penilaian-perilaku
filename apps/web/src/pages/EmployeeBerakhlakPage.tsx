/**
 * EmployeeBerakhlakPage.tsx — Halaman Format BerAKHLAK (Cetak)
 *
 * Menampilkan hasil penilaian dalam format tabel KemenPANRB yang siap dicetak.
 *
 * Format tabel:
 * | No | Perilaku Kerja (Nilai + Indikator) | Ekspektasi Khusus Pimpinan | Umpan Balik |
 *
 * Fitur:
 * - Tabel 7 baris (satu per nilai dasar BerAKHLAK)
 * - Setiap baris berisi: nama nilai, 3 indikator perilaku, umpan balik
 * - Tombol cetak (menggunakan window.print())
 * - Filter periode jika ada riwayat penilaian
 * - Styling khusus untuk cetak (print CSS)
 */

import { NILAI_DASAR, PANDUAN } from "@app/shared";
import { useEffect, useMemo, useState } from "react";
import { type AssessmentView, api, type EmployeeDash } from "../api";
import { BerakhlakRadar } from "../components/BerakhlakRadar";
import { EmployeeSubnav } from "../components/EmployeeSubnav";
import { Banner, Button, Card, PageHeader } from "../components/ui";

export function EmployeeBerakhlakPage() {
	const [dash, setDash] = useState<EmployeeDash | null>(null); // Data dashboard
	const [hist, setHist] = useState<AssessmentView[]>([]); // Riwayat penilaian
	const [err, setErr] = useState(""); // Pesan error
	const [histId, setHistId] = useState<string | null>(null); // ID riwayat yang dipilih

	// Muat data dashboard dan riwayat
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

	// Data penilaian yang dipilih (riwayat atau dashboard)
	const view = hist.find((h) => h.id === histId) ?? dash?.assessment ?? null;
	const periodLabel = view?.periodName ?? dash?.period?.name ?? "—";

	// Siapkan data untuk tabel: 7 baris (satu per nilai dasar)
	const rows = useMemo(
		() =>
			NILAI_DASAR.map((n, i) => {
				const fb = view?.feedbacks.find((f) => f.nilaiDasarCode === n.code);
				return {
					no: i + 1,
					name: n.name,
					// Ambil 3 indikator perilaku untuk nilai ini
					indicators: PANDUAN.filter((p) => p.nilaiDasarId === n.id).sort(
						(a, b) => a.sequence - b.sequence,
					),
					feedback: fb?.feedbackText?.trim() ?? "",
				};
			}),
		[view],
	);

	return (
		<div className="space-y-5">
			<EmployeeSubnav />
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<PageHeader
					title="Umpan balik BerAKHLAK"
					sub="Format KemenPANRB: perilaku kerja dan umpan balik berkelanjutan berdasarkan bukti dukung."
				/>
				{/* Tombol cetak (sembunyi saat cetak) */}
				<Button
					variant="ghost"
					className="print:hidden shrink-0"
					onClick={() => window.print()}
				>
					Cetak
				</Button>
			</div>
			{err ? <Banner tone="error">{err}</Banner> : null}

			{/* Info periode dan penilai */}
			<p className="text-sm text-ink-muted print:text-black">
				Periode {periodLabel}
				{dash?.assessorName ? ` · Penilai: ${dash.assessorName}` : ""}
				{!view ? " · Belum ada penilaian yang dikirim" : ""}
			</p>

			{/* Filter periode jika ada riwayat */}
			{hist.length > 1 ? (
				<label className="ui-label max-w-sm print:hidden">
					Periode
					<select
						className="ui-input mt-1"
						value={histId ?? view?.id ?? ""}
						onChange={(e) => setHistId(e.target.value)}
					>
						{hist.map((h) => (
							<option key={h.id} value={h.id}>
								{h.periodName ?? h.id}
							</option>
						))}
					</select>
				</label>
			) : null}

			{/* Radar chart 7 nilai dasar BerAKHLAK */}
			{view ? (
				<Card className="print:hidden">
					<h3 className="ui-title text-base mb-1">Profil Nilai BerAKHLAK</h3>
					<p className="ui-sub mb-3">
						Visualisasi skor 7 nilai dasar (skala 0–120).
					</p>
					<BerakhlakRadar scores={view.calculations.perNilai120} />
				</Card>
			) : null}

			{/* Tabel format BerAKHLAK */}
			<div className="overflow-x-auto bg-white print:overflow-visible">
				<table className="ui-panrb">
					<colgroup>
						<col className="w-10" />
						<col />
						<col />
						<col />
					</colgroup>
					<thead>
						<tr>
							<th colSpan={3}>Perilaku kerja</th>
							<th>Umpan balik berkelanjutan berdasarkan bukti dukung</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.no}>
								<td className="ui-panrb-num">{r.no}</td>
								<td>
									<div className="ui-panrb-name">{r.name}</div>
									<ul>
										{r.indicators.map((p) => (
											<li key={p.sequence}>{p.title}</li>
										))}
									</ul>
								</td>
								<td>
									<p>Ekspektasi Khusus Pimpinan :</p>
								</td>
								<td>{r.feedback}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
