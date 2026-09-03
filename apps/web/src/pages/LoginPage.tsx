/**
 * LoginPage.tsx — Halaman Login Portal Penilaian Perilaku Kerja ASN
 *
 * Desain UX Modern & Institusional:
 * - Layout split (Branding & Panduan BerAKHLAK + Formulir Masuk)
 * - 1-Click Demo Account Switcher (Admin, Penilai, Pegawai, Pimpinan)
 * - Show/Hide toggle password untuk kemudahan aksesibilitas
 * - Feedback loading spinner & error handling
 * - Kepatuhan standar aksesibilitas (Biome a11y)
 */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Banner, Button } from "../components/ui";

/** Daftar akun demo untuk pengujian cepat */
const DEMO_ACCOUNTS = [
	{
		role: "Admin & Pimpinan",
		badge: "Biro OSDM",
		email: "admin@demo.go.id",
		name: "Admin Utama",
		icon: "👑",
	},
	{
		role: "Pejabat Penilai",
		badge: "Tim Kinerja",
		email: "penilai@demo.go.id",
		name: "Budi Pratama",
		icon: "📝",
	},
	{
		role: "Pegawai Dinilai",
		badge: "Tim Kinerja",
		email: "pegawai@demo.go.id",
		name: "Siti Rahayu",
		icon: "👤",
	},
	{
		role: "Pimpinan Unit",
		badge: "Biro Umum",
		email: "pimpinan@demo.go.id",
		name: "Ahmad Wijaya",
		icon: "👔",
	},
];

export function LoginPage() {
	const { user, refresh } = useAuth();
	const nav = useNavigate();

	// State form
	const [email, setEmail] = useState("admin@demo.go.id");
	const [password, setPassword] = useState("Password1");
	const [showPassword, setShowPassword] = useState(false);
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);

	// Jika sudah login, redirect ke root
	if (user) return <Navigate to="/" replace />;

	/**
	 * Submit form login ke backend.
	 */
	async function submit(e: React.FormEvent<HTMLFormElement>) {
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

	/**
	 * Mengisi otomatis kredensial akun demo dengan 1 klik.
	 */
	function pickDemo(demoEmail: string) {
		setEmail(demoEmail);
		setPassword("Password1");
		setErr("");
	}

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-brand-mist to-sky-100/60 p-4 sm:p-6 lg:p-8">
			{/* Background ambient orbs */}
			<div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

			{/* Main Container Card */}
			<div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgb(15_23_42/0.12)] ring-1 ring-slate-900/5 lg:grid lg:grid-cols-12">
				{/* ==================== PANEL KIRI (BRANDING & EDUKASI) ==================== */}
				<div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-mid p-8 text-white lg:col-span-5 lg:flex">
					{/* Subtle geometric pattern overlay */}
					<div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

					<div className="relative z-10">
						{/* Ministry Header */}
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
								<svg
									className="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
									/>
								</svg>
							</div>
							<div>
								<p className="text-xs font-semibold tracking-wider text-white/80 uppercase">
									Kementerian Kesehatan RI
								</p>
								<p className="text-xs text-white/60">Sekretariat Jenderal</p>
							</div>
						</div>

						{/* Title & Slogan */}
						<div className="mt-8">
							<span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm">
								PermenPANRB No. 6 Tahun 2022
							</span>
							<h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
								Penilaian Perilaku Kerja ASN
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-white/80">
								Sistem evaluasi kinerja terstandarisasi berbasis Core Values
								BerAKHLAK dan Budaya Kerja Kemenkes.
							</p>
						</div>

						{/* Core Values Pills */}
						<div className="mt-6 space-y-2">
							<p className="text-xs font-semibold uppercase tracking-wider text-white/70">
								7 Nilai Dasar BerAKHLAK:
							</p>
							<div className="flex flex-wrap gap-1.5 text-[11px]">
								{[
									"Berorientasi Pelayanan",
									"Akuntabel",
									"Kompeten",
									"Harmonis",
									"Loyal",
									"Adaptif",
									"Kolaboratif",
								].map((v) => (
									<span
										key={v}
										className="rounded-md bg-white/10 px-2 py-0.5 text-white/90"
									>
										{v}
									</span>
								))}
							</div>
						</div>
					</div>

					{/* Footer Info */}
					<div className="relative z-10 border-t border-white/15 pt-4 text-xs text-white/70">
						<p>Biro Organisasi dan SDM</p>
					</div>
				</div>

				{/* ==================== PANEL KANAN (FORMULIR LOGIN) ==================== */}
				<div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
					<div>
						{/* Mobile Header */}
						<div className="mb-6 lg:hidden">
							<div className="flex items-center gap-2">
								<span className="rounded-lg bg-brand-light p-1.5 text-brand">
									<svg
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth="2"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/>
									</svg>
								</span>
								<span className="text-xs font-semibold tracking-wider text-brand uppercase">
									Kemenkes RI
								</span>
							</div>
							<h1 className="ui-title mt-2">Masuk ke Portal</h1>
							<p className="ui-sub">Penilaian Perilaku Kerja ASN BerAKHLAK</p>
						</div>

						{/* Desktop Header */}
						<div className="hidden lg:block">
							<h1 className="ui-title">Masuk ke Portal</h1>
							<p className="ui-sub">
								Gunakan email dinas Anda yang terdaftar dalam sistem.
							</p>
						</div>

						{/* 1-Click Quick Demo Switcher */}
						<div className="mt-5 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-900/5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-ink-muted">
									Pilih Akun Demo (1-Klik):
								</span>
								<span className="text-[11px] text-ink-faint">Password1</span>
							</div>
							<div className="mt-2 grid grid-cols-2 gap-2">
								{DEMO_ACCOUNTS.map((d) => {
									const active = email === d.email;
									return (
										<button
											key={d.email}
											type="button"
											onClick={() => pickDemo(d.email)}
											className={`flex items-start gap-2 rounded-xl p-2 text-left text-xs transition-all ${
												active
													? "bg-brand text-white shadow-sm ring-1 ring-brand"
													: "bg-white text-ink shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-slate-200/70 hover:bg-slate-100/70"
											}`}
										>
											<span className="text-sm">{d.icon}</span>
											<div className="min-w-0 flex-1">
												<div
													className={`font-semibold truncate ${active ? "text-white" : "text-ink"}`}
												>
													{d.name}
												</div>
												<div
													className={`text-[10px] truncate ${active ? "text-white/80" : "text-ink-muted"}`}
												>
													{d.role} · {d.badge}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						</div>

						{/* Form Login */}
						<form onSubmit={(e) => void submit(e)} className="mt-5 space-y-4">
							{/* Input Email */}
							<label className="ui-label">
								Alamat Email
								<div className="relative mt-1">
									<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth="2"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
											/>
										</svg>
									</span>
									<input
										className="ui-input !mt-0 !pl-9"
										type="email"
										autoComplete="username"
										required
										placeholder="nama@demo.go.id"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
							</label>

							{/* Input Password */}
							<label className="ui-label">
								Password
								<div className="relative mt-1">
									<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth="2"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
									</span>
									<input
										className="ui-input !mt-0 !pl-9 !pr-10"
										type={showPassword ? "text" : "password"}
										autoComplete="current-password"
										required
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-faint hover:text-ink transition-colors"
										aria-label={
											showPassword ? "Sembunyikan password" : "Lihat password"
										}
									>
										{showPassword ? (
											<svg
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth="2"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
												/>
											</svg>
										) : (
											<svg
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth="2"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/>
											</svg>
										)}
									</button>
								</div>
							</label>

							{/* Error Message */}
							{err ? (
								<div className="pt-1">
									<Banner tone="error">{err}</Banner>
								</div>
							) : null}

							{/* Submit Button with Loading State */}
							<Button
								type="submit"
								className="w-full py-2.5 font-semibold text-sm shadow-lift"
								disabled={busy}
							>
								{busy ? (
									<span className="inline-flex items-center gap-2">
										<svg
											className="h-4 w-4 animate-spin text-white"
											fill="none"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Memproses masuk…
									</span>
								) : (
									"Masuk ke Portal"
								)}
							</Button>
						</form>
					</div>

					{/* Security & Help Footer */}
					<div className="mt-6 border-t border-slate-100 pt-4">
						<div className="flex items-start gap-2 text-xs text-ink-muted">
							<svg
								className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<p className="leading-relaxed">
								Proteksi Akun: Setelah 5 kali percobaan gagal, akun dikunci 15
								menit. Butuh bantuan? Hubungi Admin Tim Pengelolaan Kinerja
								Pegawai.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
