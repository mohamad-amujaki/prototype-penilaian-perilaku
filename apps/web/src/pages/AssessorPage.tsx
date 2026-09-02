import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AssessorEmployee } from "../api";
import { BudayaRadar } from "../components/BudayaRadar";
import { Badge, Banner, Card, PageHeader, TableWrap } from "../components/ui";

export function AssessorPage() {
  const [rows, setRows] = useState<AssessorEmployee[]>([]);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    void api
      .assessorEmployees()
      .then((r) => setRows(r.data ?? []))
      .catch((e) => setErr((e as Error).message));
  }, []);
  const done = rows.filter((r) => r.status === "submitted" || r.status === "revised").length;
  const picked = rows.find((r) => r.id === sel);
  return (
    <div className="space-y-5">
      <PageHeader title="Pegawai binaan" sub={`${done} dari ${rows.length} sudah dinilai`} />
      {err ? <Banner tone="error">{err}</Banner> : null}
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
                  <button type="button" className="ui-btn-quiet" onClick={() => setSel(r.id)}>
                    {r.employeeName}
                  </button>
                </td>
                <td>
                  <Badge status={r.status} />
                </td>
                <td>{r.scoreScale120 ?? "—"}</td>
                <td>
                  <Link className="ui-btn-quiet" to={`/penilai/${r.id}`}>
                    Nilai
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
      {picked ? (
        <Card>
          <h2 className="font-semibold">Radar · {picked.employeeName}</h2>
          {picked.budayaEksekusiEfektif != null ? (
            <>
              <BudayaRadar
                ee={picked.budayaEksekusiEfektif}
                ck={picked.budayaCaraKerjaBaru ?? 0}
                pu={picked.budayaPelayananUnggul ?? 0}
              />
              <p className="text-sm text-ink-muted">
                EE {picked.budayaEksekusiEfektif} · CK {picked.budayaCaraKerjaBaru} · PU {picked.budayaPelayananUnggul}
              </p>
            </>
          ) : (
            <p className="ui-sub">Radar muncul setelah penilaian disubmit. Buka Nilai untuk mengisi.</p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
