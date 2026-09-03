/**
 * AssessorPage.tsx — Halaman Penilai (Dashboard)
 *
 * Menampilkan daftar pegawai binaan yang perlu dinilai.
 *
 * Fitur:
 * - Tabel pegawai dengan NIP, nama, status, dan skor
 * - Klik nama pegawai untuk melihat radar chart preview
 * - Tombol "Nilai" untuk membuka formulir penilaian
 * - Info progress: berapa yang sudah dinilai dari total
 *
 * Status assignment:
 * - pending: belum dinilai
 * - draft: sedang dalam draf
 * - submitted: sudah disubmit
 * - revised: sudah direvisi
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type AssessorEmployee, api } from "../api";
import { BudayaRadar } from "../components/BudayaRadar";
import { Badge, Banner, Card, PageHeader, TableWrap } from "../components/ui";

export function AssessorPage() {
	const [rows, setRows] = useState<AssessorEmployee[]>([]); // Daftar pegawai binaan
	const [err, setErr] = useState(""); // Pesan error
	const [sel, setSel] = useState<string | null>(null); // ID pegawai yang dipilih (untuk preview radar)

	// Muat daftar pegawai binaan saat komponen dimount
	useEffect(() => {
		void api
			.assessorEmployees()
			.then((r) => setRows(r.data ?? []))
			.catch((e) => setErr((e as Error).message));
	}, []);

	// Hitung berapa yang sudah dinilai
	const done = rows.filter(
		(r) => r.status === "submitted" || r.status === "revised",
	).length;

	// Data pegawai yang dipilih untuk preview radar
	const picked = rows.find((r) => r.id === sel);

	return (
		<div className="space-y-5">
			<PageHeader
				title="Pegawai binaan"
				sub={`${done} dari ${rows.length} sudah dinilai`}
			/>
			{err ? <Banner tone="error">{err}</Banner> : null}

			{/* Tabel daftar pegawai */}
			<Card>
				<TableWrap>
					<thead>
						<tr>
							<th>NIP</th>
							<th>Nama</th>
							<th>Status</th>
							<th>Skor 120</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.id}>
								<td className="font-mono text-xs text-ink-muted">{r.nip}</td>
								<td>
									{/* Klik nama untuk preview radar */}
									<button
										type="button"
										className="ui-btn-quiet"
										onClick={() => setSel(r.id)}
									>
										{r.employeeName}
									</button>
								</td>
								<td>
									<Badge status={r.status} />
								</td>
								<td>{r.scoreScale120 ?? "—"}</td>
								<td>
									{/* Tombol buka formulir penilaian */}
									<Link className="ui-btn-quiet" to={`/penilai/${r.id}`}>
										Nilai
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</TableWrap>
			</Card>

			{/* Preview radar chart untuk pegawai yang dipilih */}
			{picked ? (
				<Card>
					<h2 className="font-semibold">Radar · {picked.employeeName}</h2>
					{picked.budayaEksekusiEfektif != null ? (
						<>
							<BudayaRadar
								bk-01-ee={picked.budayaEksekusiEfektif}
								bk-02-ck={picked.budayaCaraKerjaBaru ?? 0}
								bk-03-pu={picked.budayaPelayananUnggul ?? 0}
							/>
							<p className="text-sm text-ink-muted">
								EE {picked.budayaEksekusiEfektif} · CK{" "}
								{picked.budayaCaraKerjaBaru} · PU {picked.budayaPelayananUnggul}
							</p>
						</>
					) : (
						<p className="ui-sub">
							Radar muncul setelah penilaian disubmit. Buka Nilai untuk mengisi.
						</p>
					)}
				</Card>
			) : null}
		</div>
	);
}
