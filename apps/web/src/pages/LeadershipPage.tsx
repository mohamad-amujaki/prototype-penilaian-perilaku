/**
 * LeadershipPage.tsx — Dashboard Pimpinan
 *
 * Menampilkan data agregat penilaian perilaku kerja untuk pimpinan.
 *
 * Fitur:
 * - Statistik ringkasan: jumlah dinilai, rata-rata skor, periode
 * - Radar chart agregat budaya kerja (rata-rata semua pegawai)
 * - Ranking unit: tabel peringkat unit berdasarkan rata-rata skor
 * - Drill-down: klik unit untuk melihat daftar pegawai
 * - Detail individu: klik pegawai untuk melihat radar chart individu
 * - Export CSV: unduh laporan dalam format CSV
 *
 * Otorisasi: hanya pimpinan dan admin yang bisa mengakses.
 * Pimpinan hanya melihat unit di bawah hierarki mereka.
 */

import { useEffect, useState } from "react";
import { type AggReport, api, type UnitEmp } from "../api";
import { BudayaRadar } from "../components/BudayaRadar";
import { Badge, Card, PageHeader, Stat, TableWrap } from "../components/ui";

export function LeadershipPage() {
	const [rep, setRep] = useState<AggReport | null>(null); // Data laporan agregat
	const [unitId, setUnitId] = useState<string | null>(null); // Unit yang dipilih (untuk drill-down)
	const [emps, setEmps] = useState<UnitEmp[]>([]); // Daftar pegawai di unit yang dipilih
	const [empId, setEmpId] = useState<string | null>(null); // Pegawai yang dipilih (untuk radar)

	// Muat data laporan agregat
	useEffect(() => {
		void api.leadership().then(setRep);
	}, []);

	// Muat daftar pegawai saat unit dipilih
	useEffect(() => {
		if (!unitId) return;
		setEmpId(null); // Reset pilihan pegawai
		void api.unitEmployees(unitId).then((r) => setEmps(r.data));
	}, [unitId]);

	if (!rep) return <p className="text-ink-muted">Memuat…</p>;

	// Data pegawai yang dipilih untuk preview radar
	const picked = emps.find((e) => e.employeeId === empId);

	return (
		<div className="space-y-5">
			<PageHeader
				title="Dashboard pimpinan"
				sub="Agregat perilaku kerja per unit dan budaya organisasi."
			/>

			{/* Statistik ringkasan */}
			<div className="grid gap-3 sm:grid-cols-3">
				<Stat
					label="Dinilai"
					value={`${rep.done}/${rep.totalAssigned}`}
					hint={`${rep.percent}% selesai`}
				/>
				<Stat
					label="Rata-rata 120"
					value={String(rep.avg120 || 0)}
					hint={rep.kategori}
				/>
				<Stat
					label="Periode"
					value={rep.period?.name ?? "—"}
					hint={rep.period?.status ?? ""}
				/>
			</div>

			{/* Radar chart agregat budaya kerja */}
			<Card>
				<h2 className="font-semibold">Profil budaya kerja (agregat)</h2>
				<BudayaRadar
					bk-01-ee={rep.avgEE || 0}
					bk-02-ck={rep.avgCK || 0}
					bk-03-pu={rep.avgPU || 0}
				/>
				<p className="text-sm text-ink-muted">
					EE {rep.avgEE} · CK {rep.avgCK} · PU {rep.avgPU}
				</p>
			</Card>

			{/* Ranking unit */}
			<Card>
				<h2 className="font-semibold">Ranking unit</h2>
				<TableWrap>
					<thead>
						<tr>
							<th>#</th>
							<th>Unit</th>
							<th>Avg 120</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{rep.byUnit.map((u, i) => (
							<tr key={u.unitId}>
								<td>{i + 1}</td>
								<td>
									{/* Klik unit untuk drill-down */}
									<button
										type="button"
										className="ui-btn-quiet"
										onClick={() => setUnitId(u.unitId)}
									>
										{u.unitName}
									</button>
								</td>
								<td>{u.avg120}</td>
								<td>{u.kategori}</td>
							</tr>
						))}
					</tbody>
				</TableWrap>
				{/* Link export CSV */}
				<a
					className="ui-btn-quiet mt-3 inline-flex"
					href="/api/admin/reports/export"
					target="_blank"
					rel="noreferrer"
				>
					Unduh CSV
				</a>
			</Card>

			{/* Drill-down: daftar pegawai di unit yang dipilih */}
			{unitId && (
				<Card>
					<h2 className="font-semibold">Pegawai unit</h2>
					<TableWrap>
						<thead>
							<tr>
								<th>Nama</th>
								<th>Status</th>
								<th>Skor</th>
							</tr>
						</thead>
						<tbody>
							{emps.map((e) => (
								<tr key={e.employeeId}>
									<td>
										{/* Klik pegawai untuk preview radar */}
										<button
											type="button"
											className="ui-btn-quiet"
											onClick={() => setEmpId(e.employeeId)}
										>
											{e.name}
										</button>
									</td>
									<td>
										<Badge status={e.status} />
									</td>
									<td>
										{e.scoreScale120 ?? "—"}{" "}
										{e.kategori ? `(${e.kategori})` : ""}
									</td>
								</tr>
							))}
						</tbody>
					</TableWrap>

					{/* Radar chart individu */}
					{picked ? (
						<div className="mt-4">
							<h3 className="font-medium">Radar · {picked.name}</h3>
							{picked.budayaEksekusiEfektif != null ? (
								<BudayaRadar
									bk-01-ee={picked.budayaEksekusiEfektif}
									bk-02-ck={picked.budayaCaraKerjaBaru ?? 0}
									bk-03-pu={picked.budayaPelayananUnggul ?? 0}
								/>
							) : (
								<p className="ui-sub">
									Belum ada skor submit untuk pegawai ini.
								</p>
							)}
						</div>
					) : (
						<p className="ui-sub mt-3">
							Pilih nama pegawai untuk melihat radar individunya.
						</p>
					)}
				</Card>
			)}
		</div>
	);
}
