import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="ui-title">{title}</h1>
      {sub ? <p className="ui-sub">{sub}</p> : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`ui-card ${className}`}>{children}</section>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" }) {
  const map = { primary: "ui-btn-primary", ghost: "ui-btn-ghost", quiet: "ui-btn-quiet" };
  return <button className={`${map[variant]} ${className}`} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="ui-label">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export function Banner({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" }) {
  return <div className={tone === "error" ? "ui-banner-error" : "ui-banner"}>{children}</div>;
}

export function Badge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    submitted: "bg-emerald-50 text-emerald-700",
    revised: "bg-sky-50 text-sky-800",
    pending: "bg-amber-50 text-amber-800",
    draft: "bg-slate-100 text-slate-600",
    closed: "bg-slate-100 text-slate-600",
    unassigned: "bg-rose-50 text-rose-700",
  };
  return <span className={`ui-chip ${tone[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">{children}</table>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-sm text-ink-muted">{hint}</div> : null}
    </Card>
  );
}
