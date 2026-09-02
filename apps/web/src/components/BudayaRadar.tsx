import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

export type BudayaRadarValues = {
  ee: number;
  ck: number;
  pu: number;
};

export function BudayaRadar({ ee, ck, pu, heightClass = "h-64 sm:h-72" }: BudayaRadarValues & { heightClass?: string }) {
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
          <PolarAngleAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 120]} tick={false} axisLine={false} />
          <Radar name="Skor (skala 120)" dataKey="value" stroke="#185FA5" fill="#185FA5" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
