/**
 * Layout.tsx — Layout Utama Aplikasi (App Shell)
 *
 * Menyediakan struktur tampilan yang konsisten di semua halaman:
 * - Header sticky (tetap di atas saat scroll)
 * - Navigasi berbasis peran (menu berbeda untuk admin, penilai, pimpinan)
 * - Dropdown akun (profil & logout)
 * - Menu mobile (hamburger menu)
 * - Area konten utama (via <Outlet />)
 *
 * Fitur:
 * - Responsive: tampilan berbeda untuk desktop dan mobile
 * - Role-based navigation: hanya menampilkan menu yang sesuai peran
 * - Auto-close: dropdown menu menutup saat klik di luar
 */

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

/**
 * Mengekstrak inisial dari nama lengkap.
 * Contoh: "Budi Santoso" → "BS", "Ani" → "AN"
 */
function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Layout() {
	const { user, logout } = useAuth();
	const nav = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false); // State menu mobile
	const [accountOpen, setAccountOpen] = useState(false); // State dropdown akun
	const accountRef = useRef<HTMLDivElement>(null); // Ref untuk deteksi klik di luar

	const loc = useLocation();

	// Daftar menu navigasi berdasarkan peran pengguna
	const workLinks = [
		user?.roles.includes("admin") && { to: "/admin", label: "Admin" },
		user?.roles.includes("assessor") && { to: "/penilai", label: "Penilai" },
		{ to: "/pegawai", label: "Pegawai" }, // Selalu tampilkan untuk semua peran
		user?.roles.includes("leadership") && {
			to: "/pimpinan",
			label: "Pimpinan",
		},
	].filter(Boolean) as Array<{ to: string; label: string }>;

	/**
	 * Fungsi untuk menghasilkan className NavLink.
	 * Menu "Pegawai" aktif jika path dimulai dengan /pegawai (termasuk /pegawai/berakhlak).
	 */
	const navClass =
		(to: string) =>
		({ isActive }: { isActive: boolean }) => {
			const on =
				to === "/pegawai" ? loc.pathname.startsWith("/pegawai") : isActive;
			return `ui-nav ${on ? "ui-nav-active" : ""}`;
		};

	// Tutup dropdown akun saat klik di luar area dropdown
	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!accountRef.current?.contains(e.target as Node))
				setAccountOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	/** Fungsi logout: tutup menu, panggil API logout, redirect ke login */
	async function signOut() {
		setAccountOpen(false);
		setMenuOpen(false);
		await logout();
		nav("/login");
	}

	const name = user?.fullName ?? "Akun";

	return (
		<div className="min-h-screen">
			{/* ==================== HEADER ==================== */}
			<header className="sticky top-0 z-20 bg-brand text-white shadow-[0_8px_24px_rgb(15_23_42/0.12)] print:hidden">
				<div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
					{/* Logo & judul */}
					<div className="min-w-0 shrink-0">
						<div className="truncate text-sm font-semibold tracking-tight sm:text-base">
							Penilaian Perilaku ASN
						</div>
						<div className="hidden text-xs text-white/70 sm:block">
							Kementerian Kesehatan
						</div>
					</div>

					{/* Navigasi desktop */}
					<nav
						className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
						aria-label="Menu kerja"
					>
						{workLinks.map((l) => (
							<NavLink key={l.to} to={l.to} className={navClass(l.to)}>
								{l.label}
							</NavLink>
						))}
					</nav>

					{/* Dropdown akun (desktop) */}
					<div className="relative ml-auto hidden md:block" ref={accountRef}>
						<button
							type="button"
							className="ui-account-trigger"
							aria-expanded={accountOpen}
							aria-haspopup="menu"
							onClick={() => setAccountOpen((v) => !v)}
						>
							<span className="ui-avatar" aria-hidden>
								{initials(name)}
							</span>
							<span className="max-w-[9rem] truncate">
								{name.split(" ")[0]}
							</span>
						</button>
						{accountOpen ? (
							<div className="ui-account-menu" role="menu">
								<p className="px-3 pb-2 text-xs text-ink-muted">{name}</p>
								<NavLink
									to="/profil"
									role="menuitem"
									className="ui-account-item"
									onClick={() => setAccountOpen(false)}
								>
									Profil & password
								</NavLink>
								<button
									type="button"
									role="menuitem"
									className="ui-account-item w-full text-left"
									onClick={() => void signOut()}
								>
									Keluar
								</button>
							</div>
						) : null}
					</div>

					{/* Tombol menu mobile */}
					<button
						type="button"
						className="ui-btn-ghost ml-auto !bg-white/10 !text-white !shadow-none md:hidden"
						aria-expanded={menuOpen}
						aria-label="Menu"
						onClick={() => setMenuOpen((v) => !v)}
					>
						Menu
					</button>
				</div>

				{/* Menu mobile (dropdown) */}
				{menuOpen ? (
					<div className="border-t border-white/10 px-4 py-3 md:hidden">
						<nav className="flex flex-col gap-1" aria-label="Menu kerja">
							{workLinks.map((l) => (
								<NavLink
									key={l.to}
									to={l.to}
									className={navClass(l.to)}
									onClick={() => setMenuOpen(false)}
								>
									{l.label}
								</NavLink>
							))}
						</nav>
						<div className="mt-3 border-t border-white/10 pt-3">
							<p className="px-3 text-xs text-white/60">{name}</p>
							<NavLink
								to="/profil"
								className={navClass("/profil")}
								onClick={() => setMenuOpen(false)}
							>
								Profil & password
							</NavLink>
							<button
								type="button"
								className="ui-nav mt-1 w-full text-left"
								onClick={() => void signOut()}
							>
								Keluar
							</button>
						</div>
					</div>
				) : null}
			</header>

			{/* ==================== KONTEN UTAMA ==================== */}
			<main className="ui-page">
				<Outlet /> {/* Komponen halaman aktif dirender di sini */}
			</main>
		</div>
	);
}
