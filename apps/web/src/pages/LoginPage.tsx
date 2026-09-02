import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Banner, Button, Card, Field } from "../components/ui";

export function LoginPage() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("anik@kemkes.go.id");
  const [password, setPassword] = useState("Password1");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.login(email, password);
      await refresh();
      nav("/");
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-mist p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
      <Card className="relative w-full max-w-md p-6 shadow-lift sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Kemenkes RI</p>
        <h1 className="ui-title mt-2">Masuk</h1>
        <p className="ui-sub">Penilaian Perilaku Kerja ASN</p>
        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <Field label="Email">
            <input className="ui-input" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="ui-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {err ? <Banner tone="error">{err}</Banner> : null}
          <Button className="w-full py-2.5" disabled={busy}>
            {busy ? "Masuk…" : "Masuk"}
          </Button>
        </form>
        <p className="mt-5 text-xs leading-relaxed text-ink-faint">
          Demo: anik@ / arif.mujaki@ / ani.suryani@ / budi.santoso@kemkes.go.id · default Password1
          <br />
          Setelah 5 kali salah, login dikunci 15 menit (per email). Admin bisa reset ke default.
        </p>
      </Card>
    </div>
  );
}
