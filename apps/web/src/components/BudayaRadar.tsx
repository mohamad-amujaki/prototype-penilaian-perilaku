/**
 * BudayaRadar.tsx — Komponen Radar Chart untuk Budaya Kerja
 *
 * Menampilkan visualisasi radar (spider chart) dari 3 dimensi budaya kerja:
 * - BK-01-EE: Eksekusi Efektif
 * - BK-02-CK: Cara Kerja Baru
 * - BK-03-PU: Pelayanan Unggul
 *
 * Menggunakan library Recharts dengan komponen:
 * - RadarChart: chart radar utama
 * - PolarGrid: garis grid melingkar
 * - PolarAngleAxis: sumbu sudut (nama dimensi)
 * - PolarRadiusAxis: sumbu radius (skala 0-120)
 * - Radar: area data yang terisi
 *
 * Skala: 0-120 (sesuai dengan skor skala 120 dari backend)
 */

import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";

/** Tipe data input: 3 nilai budaya kerja */
export type BudayaRadarValues = {
	"bk-01-ee": number; // Eksekusi Efektif
	"bk-02-ck": number; // Cara Kerja Baru
	"bk-03-pu": number; // Pelayanan Unggul
};

/**
 * BudayaRadar — Komponen radar chart.
 *
 * @param bk-01-ee, bk-02-ck, bk-03-pu - Nilai 3 dimensi budaya kerja (0-120)
 * @param heightClass - Class CSS untuk tinggi chart (default: "h-64 sm:h-72")
 */
export function BudayaRadar({
	"bk-01-ee": ee,
	"bk-02-ck": ck,
	"bk-03-pu": pu,
	heightClass = "h-64 sm:h-72",
}: BudayaRadarValues & { heightClass?: string }) {
	// Konversi data ke format yang dibutuhkan Recharts
	const data = [
		{ name: "Eksekusi Efektif", value: ee },
		{ name: "Cara Kerja Baru", value: ck },
		{ name: "Pelayanan Unggul", value: pu },
	];

	return (
		<div className={heightClass}>
			<ResponsiveContainer>
				<RadarChart data={data} outerRadius="72%">
					<PolarGrid stroke="#cbd5e1" />
					<PolarAngleAxis
						dataKey="name"
						tick={{ fill: "#64748B", fontSize: 11 }}
					/>
					<PolarRadiusAxis domain={[0, 120]} tick={false} axisLine={false} />
					<Radar
						name="Skor (skala 120)"
						dataKey="value"
						stroke="#185FA5"
						fill="#185FA5"
						fillOpacity={0.28}
					/>
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}
