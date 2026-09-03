/**
 * ui.tsx — Komponen UI yang Dapat Digunakan Kembali (Reusable Components)
 *
 * Berisi komponen dasar yang digunakan di seluruh aplikasi:
 * - PageHeader: judul halaman dengan sub-judul
 * - Card: kontainer dengan bayangan dan border
 * - Button: tombol dengan 3 varian (primary, ghost, quiet)
 * - Field: label + input + hint text
 * - Banner: pesan informasi atau error
 * - Badge: label status berwarna
 * - TableWrap: pembungkus tabel dengan overflow scroll
 * - Stat: kartu statistik dengan nilai besar
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * PageHeader — Judul halaman.
 * @param title - Judul utama
 * @param sub - Sub-judul (opsional)
 */
export function PageHeader({ title, sub }: { title: string; sub?: string }) {
	return (
		<header className="mb-6">
			<h1 className="ui-title">{title}</h1>
			{sub ? <p className="ui-sub">{sub}</p> : null}
		</header>
	);
}

/**
 * Card — Kontainer konten dengan bayangan halus.
 * Digunakan untuk membungkus bagian-bagian halaman.
 */
export function Card({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return <section className={`ui-card ${className}`}>{children}</section>;
}

/**
 * Button — Tombol dengan 3 varian:
 * - primary: tombol utama (biru, teks putih)
 * - ghost: tombol sekunder (border transparan)
 * - quiet: tombol tanpa border (teks saja)
 */
export function Button({
	variant = "primary",
	className = "",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "ghost" | "quiet";
}) {
	const map = {
		primary: "ui-btn-primary",
		ghost: "ui-btn-ghost",
		quiet: "ui-btn-quiet",
	};
	return <button className={`${map[variant]} ${className}`} {...props} />;
}

/**
 * Field — Wrapper label + input + hint.
 * Digunakan di formulir untuk konsistensi spacing.
 *
 * @param label - Teks label
 * @param hint - Teks petunjuk di bawah input (opsional)
 * @param children - Input/form element
 */
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
		// biome-ignore lint/a11y/noLabelWithoutControl: Component ini selalu menerima input sebagai children
		<label className="ui-label">
			{label}
			{children}
			{hint ? (
				<span className="mt-1 block text-xs font-normal text-ink-faint">
					{hint}
				</span>
			) : null}
		</label>
	);
}

/**
 * Banner — Pesan informasi atau error.
 * @param tone - "info" (biru) atau "error" (merah)
 */
export function Banner({
	children,
	tone = "info",
}: {
	children: ReactNode;
	tone?: "info" | "error";
}) {
	return (
		<div className={tone === "error" ? "ui-banner-error" : "ui-banner"}>
			{children}
		</div>
	);
}

/**
 * Badge — Label status berwarna.
 *
 * Warna berbeda untuk setiap status:
 * - active/submitted: hijau
 * - revised: biru muda
 * - pending: kuning
 * - draft/closed: abu-abu
 * - unassigned: merah muda
 */
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
	return (
		<span
			className={`ui-chip ${tone[status] ?? "bg-slate-100 text-slate-600"}`}
		>
			{status}
		</span>
	);
}

/**
 * TableWrap — Pembungkus tabel dengan overflow horizontal.
 * Tabel akan bisa di-scroll secara horizontal jika kontennya lebih lebar dari layar.
 */
export function TableWrap({ children }: { children: ReactNode }) {
	return (
		<div className="ui-table-wrap">
			<table className="ui-table">{children}</table>
		</div>
	);
}

/**
 * Stat — Kartu statistik dengan nilai besar.
 * Digunakan di dashboard untuk menampilkan ringkasan.
 *
 * @param label - Label statistik (contoh: "Dinilai")
 * @param value - Nilai utama (contoh: "12/20")
 * @param hint - Teks tambahan (opsional, contoh: "60% selesai")
 */
export function Stat({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<Card>
			<div className="text-xs font-medium uppercase tracking-wide text-ink-faint">
				{label}
			</div>
			<div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
			{hint ? <div className="mt-1 text-sm text-ink-muted">{hint}</div> : null}
		</Card>
	);
}
