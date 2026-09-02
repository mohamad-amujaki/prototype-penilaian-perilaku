import { useEffect, useMemo, useRef, useState } from "react";
import type { UserRow } from "../api";

export function PersonSelect({
  users,
  value,
  excludeId,
  disabled,
  placeholder = "Pilih atasan",
  onChange,
}: {
  users: UserRow[];
  value: string;
  excludeId?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = users.find((u) => u.id === value);

  const options = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter((u) => u.id !== excludeId)
      .filter((u) => {
        if (!s) return true;
        return (
          u.fullName.toLowerCase().includes(s) ||
          (u.nip ?? "").includes(s) ||
          (u.jabatan ?? "").toLowerCase().includes(s)
        );
      })
      .slice(0, 80);
  }, [users, excludeId, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      window.setTimeout(() => searchRef.current?.focus(), 20);
    }
  }, [open]);

  return (
    <div className="relative min-w-[12rem] max-w-xs" ref={root}>
      <button
        type="button"
        disabled={disabled}
        className="ui-input mt-0 flex w-full items-center justify-between gap-2 py-1.5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "truncate" : "truncate text-ink-faint"}>{selected ? selected.fullName : placeholder}</span>
        <span className="text-ink-faint">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-lift">
          <input
            ref={searchRef}
            className="ui-input mt-0 rounded-none border-0 shadow-none"
            placeholder="Cari nama atau NIP"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="max-h-56 overflow-auto py-1">
            <li>
              <button
                type="button"
                className="ui-account-item w-full text-left text-ink-muted"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Lepas atasan
              </button>
            </li>
            {options.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={`ui-account-item w-full text-left ${u.id === value ? "bg-brand-light" : ""}`}
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-ink-faint">
                    {[u.nip, u.jabatan].filter(Boolean).join(" · ") || u.email}
                  </div>
                </button>
              </li>
            ))}
            {!options.length ? <li className="px-3 py-2 text-xs text-ink-faint">Tidak ada hasil</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
