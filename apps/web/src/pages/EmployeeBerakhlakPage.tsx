import { NILAI_DASAR, PANDUAN } from "@app/shared";
import { useEffect, useMemo, useState } from "react";
import { api, type AssessmentView, type EmployeeDash } from "../api";
import { EmployeeSubnav } from "../components/EmployeeSubnav";
import { Banner, Button, PageHeader } from "../components/ui";

export function EmployeeBerakhlakPage() {
  const [dash, setDash] = useState<EmployeeDash | null>(null);
  const [hist, setHist] = useState<AssessmentView[]>([]);
  const [err, setErr] = useState("");
  const [histId, setHistId] = useState<string | null>(null);

  useEffect(() => {
    void api
      .employeeDash()
      .then((d) => {
        setDash(d);
        if (d.assessment?.id) setHistId((cur) => cur ?? d.assessment!.id);
      })
      .catch((e) => setErr((e as Error).message));
    void api
      .employeeHistory()
      .then((r) => setHist(r.data ?? []))
      .catch((e) => setErr((e as Error).message));
  }, []);

  const view = hist.find((h) => h.id === histId) ?? dash?.assessment ?? null;
  const periodLabel = view?.periodName ?? dash?.period?.name ?? "—";

  const rows = useMemo(
    () =>
      NILAI_DASAR.map((n, i) => {
        const fb = view?.feedbacks.find((f) => f.nilaiDasarCode === n.code);
        return {
          no: i + 1,
          name: n.name,
          indicators: PANDUAN.filter((p) => p.nilaiDasarId === n.id).sort((a, b) => a.sequence - b.sequence),
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
        <Button variant="ghost" className="print:hidden shrink-0" onClick={() => window.print()}>
          Cetak
        </Button>
      </div>
      {err ? <Banner tone="error">{err}</Banner> : null}
      <p className="text-sm text-ink-muted print:text-black">
        Periode {periodLabel}
        {dash?.assessorName ? ` · Penilai: ${dash.assessorName}` : ""}
        {!view ? " · Belum ada penilaian yang dikirim" : ""}
      </p>
      {hist.length > 1 ? (
        <label className="ui-label max-w-sm print:hidden">
          Periode
          <select className="ui-input mt-1" value={histId ?? view?.id ?? ""} onChange={(e) => setHistId(e.target.value)}>
            {hist.map((h) => (
              <option key={h.id} value={h.id}>
                {h.periodName ?? h.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}
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
