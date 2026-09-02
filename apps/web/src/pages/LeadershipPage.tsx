import { useEffect, useState } from "react";
import { api, type AggReport, type UnitEmp } from "../api";
import { BudayaRadar } from "../components/BudayaRadar";
import { Badge, Card, PageHeader, Stat, TableWrap } from "../components/ui";

export function LeadershipPage() {
  const [rep, setRep] = useState<AggReport | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [emps, setEmps] = useState<UnitEmp[]>([]);
  const [empId, setEmpId] = useState<string | null>(null);
  useEffect(() => {
    void api.leadership().then(setRep);
  }, []);
  useEffect(() => {
    if (!unitId) return;
    setEmpId(null);
    void api.unitEmployees(unitId).then((r) => setEmps(r.data));
  }, [unitId]);
  if (!rep) return <p className="text-ink-muted">Memuat…</p>;
  const picked = emps.find((e) => e.employeeId === empId);
  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard pimpinan" sub="Agregat perilaku kerja per unit dan budaya organisasi." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Dinilai" value={`${rep.done}/${rep.totalAssigned}`} hint={`${rep.percent}% selesai`} />
        <Stat label="Rata-rata 120" value={String(rep.avg120 || 0)} hint={rep.kategori} />
        <Stat label="Periode" value={rep.period?.name ?? "—"} hint={rep.period?.status ?? ""} />
      </div>
      <Card>
        <h2 className="font-semibold">Profil budaya kerja (agregat)</h2>
        <BudayaRadar ee={rep.avgEE || 0} ck={rep.avgCK || 0} pu={rep.avgPU || 0} />
        <p className="text-sm text-ink-muted">
          EE {rep.avgEE} · CK {rep.avgCK} · PU {rep.avgPU}
        </p>
      </Card>
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
                  <button className="ui-btn-quiet" onClick={() => setUnitId(u.unitId)}>
                    {u.unitName}
                  </button>
                </td>
                <td>{u.avg120}</td>
                <td>{u.kategori}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <a className="ui-btn-quiet mt-3 inline-flex" href="/api/admin/reports/export" target="_blank" rel="noreferrer">
          Unduh CSV
        </a>
      </Card>
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
                    <button type="button" className="ui-btn-quiet" onClick={() => setEmpId(e.employeeId)}>
                      {e.name}
                    </button>
                  </td>
                  <td>
                    <Badge status={e.status} />
                  </td>
                  <td>
                    {e.scoreScale120 ?? "—"} {e.kategori ? `(${e.kategori})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {picked ? (
            <div className="mt-4">
              <h3 className="font-medium">Radar · {picked.name}</h3>
              {picked.budayaEksekusiEfektif != null ? (
                <BudayaRadar
                  ee={picked.budayaEksekusiEfektif}
                  ck={picked.budayaCaraKerjaBaru ?? 0}
                  pu={picked.budayaPelayananUnggul ?? 0}
                />
              ) : (
                <p className="ui-sub">Belum ada skor submit untuk pegawai ini.</p>
              )}
            </div>
          ) : (
            <p className="ui-sub mt-3">Pilih nama pegawai untuk melihat radar individunya.</p>
          )}
        </Card>
      )}
    </div>
  );
}
