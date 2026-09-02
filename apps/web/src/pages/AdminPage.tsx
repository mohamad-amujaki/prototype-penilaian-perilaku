import { useEffect, useMemo, useState } from "react";
import { api, type Assignment, type MasterPayload, type Period, type Role, type UserRow } from "../api";
import { useAuth } from "../auth";
import { PersonSelect } from "../components/PersonSelect";
import { Badge, Banner, Button, Card, PageHeader, TableWrap } from "../components/ui";
import { useToast } from "../toast";

function toEpoch(date: string) {
  return Math.floor(new Date(date).getTime() / 1000);
}

const TABS = [
  { id: "periode", label: "Periode" },
  { id: "atasan", label: "Atasan" },
  { id: "pengguna", label: "Pengguna" },
  { id: "master", label: "Master data" },
  { id: "audit", label: "Audit" },
] as const;

export function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("periode");
  return (
    <div>
      <PageHeader title="Admin" sub="Kelola periode, atasan, pegawai, dan master data penilaian." />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-surface">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`ui-btn shrink-0 flex-1 ${tab === t.id ? "bg-brand text-white" : "text-ink-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "periode" && <Periods />}
      {tab === "atasan" && <Atasan />}
      {tab === "pengguna" && <Users />}
      {tab === "master" && <Master />}
      {tab === "audit" && <Audit />}
    </div>
  );
}

function Periods() {
  const toast = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [form, setForm] = useState({
    name: "Q2 2026",
    quarter: "Q2",
    year: 2026,
    start: "2026-04-01",
    end: "2026-06-30",
    deadline: "2026-07-31",
  });
  const [sel, setSel] = useState<string>("");
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [importNotes, setImportNotes] = useState("");

  async function load() {
    const p = await api.periods();
    setPeriods(p.data);
    if (!sel && p.data[0]) setSel(p.data[0].id);
    setUsers((await api.users()).data);
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!sel) return;
    void api.assignments(sel).then((r) => setAssigns(r.data));
  }, [sel]);

  async function changeAtasan(a: Assignment, assessorId: string) {
    if (assessorId === (a.assessorId ?? "")) return;
    setBusyId(a.id);
    try {
      await api.patchAssignment(a.id, assessorId);
      setAssigns((await api.assignments(sel)).data);
      const name = users.find((u) => u.id === assessorId)?.fullName;
      toast.push(assessorId ? `Atasan ${a.employeeName} diubah ke ${name}` : `Atasan ${a.employeeName} dilepas`);
    } catch (e) {
      toast.push((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-semibold">Periode</h2>
        <TableWrap>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className={sel === p.id ? "bg-brand-light/60" : ""}>
                <td>
                  <button className="ui-btn-quiet" onClick={() => setSel(p.id)}>
                    {p.name}
                  </button>
                </td>
                <td>
                  <Badge status={p.status} />
                </td>
                <td className="space-x-1 whitespace-nowrap">
                  <Button
                    variant="quiet"
                    onClick={() =>
                      api
                        .activatePeriod(p.id)
                        .then(() => {
                          toast.push(`Periode ${p.name} diaktifkan`);
                          return load();
                        })
                        .catch((e) => toast.push(e.message, "error"))
                    }
                  >
                    Aktifkan
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() =>
                      api.closePeriod(p.id).then(() => {
                        toast.push(`Periode ${p.name} ditutup`);
                        return load();
                      })
                    }
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() =>
                      api
                        .reopenPeriod(p.id)
                        .then(() => {
                          toast.push(`Periode ${p.name} dibuka lagi`);
                          return load();
                        })
                        .catch((e) => toast.push(e.message, "error"))
                    }
                  >
                    Buka lagi
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() =>
                      api.notifyPeriod(p.id).then((r) => toast.push(`Reminder terkirim ke ${r.sent} penilai`))
                    }
                  >
                    Reminder
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
      <form
        className="ui-card grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void api
            .createPeriod({
              name: form.name,
              quarter: form.quarter,
              year: Number(form.year),
              startDate: toEpoch(form.start),
              endDate: toEpoch(form.end),
              deadlineDate: toEpoch(form.deadline),
            })
            .then(() => {
              toast.push(`Periode ${form.name} ditambahkan`);
              return load();
            })
            .catch((ex) => toast.push((ex as Error).message, "error"));
        }}
      >
        <h2 className="font-semibold sm:col-span-2 lg:col-span-3">Buat periode</h2>
        <input className="ui-input mt-0" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="ui-input mt-0" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
          {["Q1", "Q2", "Q3", "Q4"].map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
        <input className="ui-input mt-0" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
        <input className="ui-input mt-0" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
        <input className="ui-input mt-0" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        <input className="ui-input mt-0" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        <Button className="sm:col-span-2 lg:col-span-1">Simpan draft</Button>
      </form>
      {sel && (
        <Card>
          <h2 className="font-semibold">Assignment & import Excel</h2>
          <p className="ui-sub">
            Unduh template, lengkapi data pegawai, lalu unggah .xlsx atau .csv. Ubah atasan di tab Atasan atau langsung di tabel ini.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button onClick={() => void api.downloadImportTemplate(sel).catch((e) => toast.push((e as Error).message, "error"))}>
              Unduh template Excel
            </Button>
            <label className="ui-btn-ghost cursor-pointer">
              Pilih file
              <input
                className="hidden"
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              variant="ghost"
              onClick={() => {
                if (!file) {
                  toast.push("Pilih file Excel/CSV hasil pengisian template", "error");
                  return;
                }
                void api
                  .importCsv(sel, file)
                  .then(async (r) => {
                    toast.push(`Import ${r.imported} baris berhasil`);
                    setImportNotes(
                      [
                        r.created ? `${r.created} akun baru memakai password default ${r.defaultPassword}. Wajib ganti di Profil.` : "",
                        r.errors.length ? r.errors.join("; ") : "",
                      ]
                        .filter(Boolean)
                        .join(" "),
                    );
                    const [userRes, asgRes] = await Promise.all([api.users(), api.assignments(sel)]);
                    setUsers(userRes.data);
                    setAssigns(asgRes.data);
                  })
                  .catch((e) => toast.push((e as Error).message, "error"));
              }}
            >
              Unggah
            </Button>
            {file ? <span className="text-xs text-ink-muted">{file.name}</span> : null}
          </div>
          {importNotes ? <Banner>{importNotes}</Banner> : null}
          <div className="mt-4">
            <AssignmentRows assigns={assigns} users={users} busyId={busyId} onChange={changeAtasan} />
          </div>
        </Card>
      )}
    </div>
  );
}

function Atasan() {
  const toast = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [sel, setSel] = useState("");
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [p, u] = await Promise.all([api.periods(), api.users()]);
      setPeriods(p.data);
      setUsers(u.data);
      const active = p.data.find((x) => x.status === "active") ?? p.data[0];
      if (active) setSel(active.id);
    })();
  }, []);

  useEffect(() => {
    if (!sel) return;
    void api.assignments(sel).then((r) => setAssigns(r.data));
  }, [sel]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return assigns.filter((a) => {
      if (onlyOpen && a.assessorId) return false;
      if (!s) return true;
      const hay = `${a.employeeName ?? ""} ${a.employeeNip ?? ""} ${a.assessorName ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [assigns, q, onlyOpen]);

  async function changeAtasan(a: Assignment, assessorId: string) {
    if (assessorId === (a.assessorId ?? "")) return;
    setBusyId(a.id);
    try {
      await api.patchAssignment(a.id, assessorId);
      setAssigns((await api.assignments(sel)).data);
      const name = users.find((u) => u.id === assessorId)?.fullName;
      toast.push(assessorId ? `Atasan ${a.employeeName} diubah ke ${name}` : `Atasan ${a.employeeName} dilepas`);
    } catch (e) {
      toast.push((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  }

  const missing = assigns.filter((a) => !a.assessorId).length;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-semibold">Ubah atasan / penilai</h2>
          <p className="ui-sub">
            Pilih pegawai, lalu pilih atasan. Atasan otomatis mendapat peran Penilai. Tidak boleh menilai diri sendiri.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="ui-label sm:w-52">
            Periode
            <select className="ui-input mt-1" value={sel} onChange={(e) => setSel(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-label sm:w-56">
            Cari
            <input className="ui-input mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pegawai atau atasan" />
          </label>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className={`ui-role ${onlyOpen ? "ui-role-off" : "ui-role-on"}`} onClick={() => setOnlyOpen(false)}>
          Semua ({assigns.length})
        </button>
        <button type="button" className={`ui-role ${onlyOpen ? "ui-role-on" : "ui-role-off"}`} onClick={() => setOnlyOpen(true)}>
          Belum ada atasan ({missing})
        </button>
      </div>
      <AssignmentRows assigns={filtered} users={users} busyId={busyId} onChange={changeAtasan} />
      {!filtered.length ? <p className="mt-3 text-sm text-ink-muted">Tidak ada pegawai pada filter ini.</p> : null}
    </Card>
  );
}

function AssignmentRows({
  assigns,
  users,
  busyId,
  onChange,
}: {
  assigns: Assignment[];
  users: UserRow[];
  busyId: string | null;
  onChange: (a: Assignment, assessorId: string) => void;
}) {
  return (
    <TableWrap>
      <thead>
        <tr>
          <th>Pegawai</th>
          <th>Atasan</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {assigns.map((a) => (
          <tr key={a.id}>
            <td>
              <div className="font-medium">{a.employeeName}</div>
              <div className="text-xs text-ink-muted">{[a.employeeNip, a.employeeJabatan].filter(Boolean).join(" · ")}</div>
            </td>
            <td>
              <PersonSelect
                users={users}
                value={a.assessorId ?? ""}
                excludeId={a.employeeId}
                disabled={busyId === a.id}
                onChange={(id) => onChange(a, id)}
              />
            </td>
            <td>
              <Badge status={a.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

function Users() {
  const toast = useToast();
  const { user: me, refresh } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setUsers((await api.users()).data);
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.nip ?? "").includes(s),
    );
  }, [users, q]);

  async function toggleRole(u: UserRow, role: Role) {
    if (role === "employee") return;
    const next = u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role];
    if (!next.includes("employee")) next.push("employee");
    setBusyId(u.id);
    try {
      const res = await api.setUserRoles(u.id, next as Role[]);
      setUsers((list) => list.map((row) => (row.id === u.id ? { ...row, roles: res.roles } : row)));
      toast.push(`Peran ${u.fullName} disimpan`);
      if (me?.id === u.id) await refresh();
    } catch (e) {
      toast.push((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Pengguna & peran</h2>
          <p className="ui-sub">
            Ketuk lencana untuk menambah atau melepas peran. Pegawai selalu aktif. Admin terakhir tidak bisa dilepas.
          </p>
        </div>
        <label className="ui-label sm:w-64">
          Cari
          <input className="ui-input mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama, email, NIP" />
        </label>
      </div>
      <div className="mt-4">
        <TableWrap>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Peran</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-ink-muted">{u.email}</div>
                  {u.unitName ? <div className="text-xs text-ink-faint">{u.unitName}</div> : null}
                </td>
                <td>
                  <RoleToggles roles={u.roles} disabled={busyId === u.id} onToggle={(role) => void toggleRole(u, role)} />
                </td>
                <td>
                  <Button
                    variant="quiet"
                    onClick={() =>
                      api
                        .resetPassword(u.id)
                        .then((r) =>
                          toast.push(
                            `Password ${u.email} dikembalikan ke default ${r.defaultPassword ?? r.temporaryPassword}`,
                          ),
                        )
                        .catch((e) => toast.push((e as Error).message, "error"))
                    }
                  >
                    Reset ke default
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </Card>
  );
}

const ROLE_OPTIONS: Array<{ id: Role; label: string; hint: string; locked?: boolean }> = [
  { id: "employee", label: "Pegawai", hint: "Melihat hasil penilaian sendiri", locked: true },
  { id: "assessor", label: "Penilai", hint: "Menilai pegawai binaan" },
  { id: "leadership", label: "Pimpinan", hint: "Dashboard agregat unit" },
  { id: "admin", label: "Admin", hint: "Kelola periode, pengguna, master data" },
];

function RoleToggles({
  roles,
  disabled,
  onToggle,
}: {
  roles: string[];
  disabled: boolean;
  onToggle: (role: Role) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLE_OPTIONS.map((opt) => {
        const on = roles.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.hint}
            disabled={disabled || opt.locked}
            className={`ui-role ${on ? "ui-role-on" : "ui-role-off"}`}
            aria-pressed={on}
            onClick={() => onToggle(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Master() {
  const toast = useToast();
  const [data, setData] = useState<MasterPayload | null>(null);
  useEffect(() => {
    void api.master().then(setData);
  }, []);
  if (!data) return <p className="text-ink-muted">Memuat…</p>;
  return (
    <div className="space-y-4">
      {data.nilaiDasar.map((n) => (
        <Card key={n.id}>
          <div className="font-semibold">
            {n.code} · {n.name}
          </div>
          <textarea
            className="ui-input"
            defaultValue={n.description}
            onBlur={(e) => {
              if (e.target.value === n.description) return;
              void api
                .patchNilai(n.id, { name: n.name, description: e.target.value })
                .then(() => toast.push(`Deskripsi ${n.name} disimpan`))
                .catch((err) => toast.push((err as Error).message, "error"));
            }}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {data.anchors
              .filter((a) => a.nilaiDasarId === n.id)
              .sort((a, b) => a.level - b.level)
              .map((a) => (
                <label key={a.id} className="ui-label">
                  Jangkar L{a.level}
                  <textarea
                    className="ui-input min-h-[5rem]"
                    defaultValue={a.anchorText}
                    onBlur={(e) => {
                      if (e.target.value === a.anchorText) return;
                      void api
                        .patchAnchor(a.id, e.target.value)
                        .then(() => toast.push(`Jangkar L${a.level} ${n.name} disimpan`))
                        .catch((err) => toast.push((err as Error).message, "error"));
                    }}
                  />
                </label>
              ))}
            {data.feedbackTemplates
              .filter((a) => a.nilaiDasarId === n.id)
              .sort((a, b) => a.level - b.level)
              .map((a) => (
                <label key={a.id} className="ui-label">
                  Feedback L{a.level}
                  <textarea
                    className="ui-input min-h-[5rem]"
                    defaultValue={a.templateText}
                    onBlur={(e) => {
                      if (e.target.value === a.templateText) return;
                      void api
                        .patchFeedback(a.id, e.target.value)
                        .then(() => toast.push(`Feedback L${a.level} ${n.name} disimpan`))
                        .catch((err) => toast.push((err as Error).message, "error"));
                    }}
                  />
                </label>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Audit() {
  const [data, setData] = useState<{ assessments: unknown[]; master: unknown[] } | null>(null);
  useEffect(() => {
    void api.audit().then(setData);
  }, []);
  return (
    <Card>
      <pre className="max-h-[70vh] overflow-auto text-xs text-ink-muted">{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}
