/**
 * App.tsx — Komponen Root dan Konfigurasi Routing
 *
 * File ini berisi:
 * 1. Definisi semua route aplikasi
 * 2. Gate: komponen pengaman yang memblokir akses jika belum login
 * 3. HomeRedirect: pengalihan otomatis berdasarkan peran pengguna
 * 4. ScorePreview: komponen ringkasan skor penilaian (digunakan di beberapa halaman)
 */

import { calculateScores, NILAI_CODES, type NilaiCode } from "@app/shared";
import { useMemo } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { BudayaRadar } from "./components/BudayaRadar";
import { Layout } from "./Layout";
import { AdminPage } from "./pages/AdminPage";
import { AssessorFormPage } from "./pages/AssessorFormPage";
import { AssessorPage } from "./pages/AssessorPage";
import { EmployeeBerakhlakPage } from "./pages/EmployeeBerakhlakPage";
import { EmployeePage } from "./pages/EmployeePage";
import { LeadershipPage } from "./pages/LeadershipPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ToastProvider } from "./toast";

/**
 * Gate — Komponen pengaman autentikasi.
 *
 * Memeriksa:
 * 1. Apakah pengguna sudah login (jika tidak, redirect ke /login)
 * 2. Apakah pengguna harus mengganti password (jika ya, redirect ke /profil)
 * 3. Apakah aplikasi sedang memuat data sesi (tampilkan loading)
 */
function Gate({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const loc = useLocation();

	// Tampilkan loading saat memuat data sesi
	if (loading)
		return (
			<div className="flex min-h-screen items-center justify-center text-ink-muted">
				Memuat…
			</div>
		);

	// Jika belum login, redirect ke halaman login
	if (!user) return <Navigate to="/login" replace />;

	// Jika harus ganti password (admin reset), paksa ke halaman profil
	if (user.mustChangePassword && loc.pathname !== "/profil")
		return <Navigate to="/profil" replace />;

	return <>{children}</>;
}

/**
 * HomeRedirect — Pengalihan otomatis berdasarkan peran pengguna.
 *
 * Prioritas pengalihan:
 * 1. admin → /admin
 * 2. leadership → /pimpinan
 * 3. assessor → /penilai
 * 4. employee (default) → /pegawai
 */
function HomeRedirect() {
	const { user } = useAuth();
	if (!user) return <Navigate to="/login" replace />;
	if (user.roles.includes("admin")) return <Navigate to="/admin" replace />;
	if (user.roles.includes("leadership"))
		return <Navigate to="/pimpinan" replace />;
	if (user.roles.includes("assessor"))
		return <Navigate to="/penilai" replace />;
	return <Navigate to="/pegawai" replace />;
}

/**
 * App — Komponen root aplikasi.
 *
 * Membungkus semua halaman dengan:
 * 1. AuthProvider: context autentikasi (sesi pengguna)
 * 2. ToastProvider: context notifikasi toast
 * 3. Gate: pengaman autentikasi
 * 4. Layout: layout aplikasi (header, navigasi, konten)
 */
export default function App() {
	return (
		<AuthProvider>
			<ToastProvider>
				<Routes>
					{/* Halaman login tidak dibungkus Gate */}
					<Route path="/login" element={<LoginPage />} />

					{/* Semua halaman lain dibungkus Gate + Layout */}
					<Route
						element={
							<Gate>
								<Layout />
							</Gate>
						}
					>
						<Route path="/" element={<HomeRedirect />} />
						<Route path="/admin" element={<AdminPage />} />
						<Route path="/penilai" element={<AssessorPage />} />
						<Route
							path="/penilai/:assignmentId"
							element={<AssessorFormPage />}
						/>
						<Route path="/pegawai" element={<EmployeePage />} />
						<Route
							path="/pegawai/berakhlak"
							element={<EmployeeBerakhlakPage />}
						/>
						<Route path="/pimpinan" element={<LeadershipPage />} />
						<Route path="/profil" element={<ProfilePage />} />
					</Route>
				</Routes>
			</ToastProvider>
		</AuthProvider>
	);
}

/**
 * ScorePreview — Komponen ringkasan skor penilaian.
 *
 * Menampilkan:
 * - Total skor mentah (dari 35)
 * - Skor skala 120 dengan kategori
 * - Radar chart 3 dimensi budaya kerja
 * - Detail skor per dimensi
 *
 * Digunakan di: halaman formulir penilai (ringkasan) dan halaman pegawai.
 */
export function ScorePreview({ scores }: { scores: Record<string, number> }) {
	// Konversi scores ke tipe yang benar (NilaiCode → number)
	const s = useMemo(
		() =>
			Object.fromEntries(
				NILAI_CODES.map((c) => [c, Number(scores[c])]),
			) as Record<NilaiCode, number>,
		[scores],
	);

	// Hitung semua skor (hanya jika semua nilai terisi)
	const calc = useMemo(() => {
		if (NILAI_CODES.some((c) => !s[c])) return null;
		try {
			return calculateScores(s);
		} catch {
			return null;
		}
	}, [s]);

	if (!calc) return null;

	return (
		<div className="ui-card text-sm">
			<div className="font-semibold text-brand">Ringkasan</div>
			<p className="mt-2 text-ink-muted">
				Total {calc.totalScore}/35 · Nilai perilaku {calc.scoreScale120} (
				{calc.kategoriNilaiPerilaku})
			</p>
			<BudayaRadar
				bk-01-ee={calc.budayaEksekusiEfektif}
				bk-02-ck={calc.budayaCaraKerjaBaru}
				bk-03-pu={calc.budayaPelayananUnggul}
			/>
			<p className="text-ink-muted">
				Eksekusi Efektif {calc.budayaEksekusiEfektif} (
				{calc.kategoriEksekusiEfektif})
			</p>
			<p className="text-ink-muted">
				Cara Kerja Baru {calc.budayaCaraKerjaBaru} ({calc.kategoriCaraKerjaBaru}
				)
			</p>
			<p className="text-ink-muted">
				Pelayanan Unggul {calc.budayaPelayananUnggul} (
				{calc.kategoriPelayananUnggul})
			</p>
		</div>
	);
}
