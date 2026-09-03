/**
 * BerakhlakRadar.tsx — Komponen Radar Chart untuk 7 Nilai Dasar ASN BerAKHLAK
 *
 * Menampilkan visualisasi radar (spider chart) dari 7 core values:
 * - ND-01-BP: Berorientasi Pelayanan
 * - ND-02-AK: Akuntabel
 * - ND-03-KP: Kompeten
 * - ND-04-HM: Harmonis
 * - ND-05-LY: Loyal
 * - ND-06-AD: Adaptif
 * - ND-07-KB: Kolaboratif
 *
 * Skala: 0-120 (sesuai dengan perNilai120 dari backend)
 */

import { NILAI_DASAR } from "@app/shared";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";

export type BerakhlakRadarValues = Record<string, number>;

export function BerakhlakRadar({
	scores,
	heightClass = "h-72 sm:h-80",
}: { scores: BerakhlakRadarValues; heightClass?: string }) {
	const data = NILAI_DASAR.map((n) => ({
		name: n.name,
		value: scores[n.code] ?? 0,
	}));

	return (
		<div className={heightClass}>
			<ResponsiveContainer>
				<RadarChart data={data} outerRadius="70%">
					<PolarGrid stroke="#cbd5e1" />
					<PolarAngleAxis
						dataKey="name"
						tick={{ fill: "#64748B", fontSize: 10 }}
					/>
					<PolarRadiusAxis domain={[0, 120]} tick={false} axisLine={false} />
					<Radar
						name="Skor (skala 120)"
						dataKey="value"
						stroke="#185FA5"
						fill="#185FA5"
						fillOpacity={0.25}
					/>
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}
