/**
 * auth.ts — Konteks Autentikasi React
 *
 * Menyediakan state sesi pengguna ke seluruh komponen.
 *
 * Fitur:
 * - AuthProvider: membungkus aplikasi dan menyediakan state sesi
 * - useAuth: hook untuk mengakses state sesi dari komponen mana pun
 *
 * State yang disediakan:
 * - user: data sesi pengguna (null jika belum login)
 * - loading: true saat masih memuat data sesi awal
 * - refresh(): memuat ulang data sesi dari server
 * - logout(): menghapus sesi dan redirect ke login
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { api, type SessionUser } from "./api";

/**
 * Context autentikasi.
 * Default value: user null, loading true, fungsi no-op.
 */
const Ctx = createContext<{
	user: SessionUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
}>({
	user: null,
	loading: true,
	refresh: async () => {},
	logout: async () => {},
});

/**
 * AuthProvider — Komponen pembungkus yang menyediakan state autentikasi.
 *
 * Saat pertama kali dimuat:
 * 1. Panggil /api/me untuk cek sesi (berdasarkan cookie)
 * 2. Jika ada sesi, set user
 * 3. Jika tidak ada, set user = null
 * 4. Set loading = false
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);

	/**
	 * Refresh: memuat ulang data sesi dari server.
	 * Dipanggil setelah login, logout, atau perubahan profil.
	 */
	async function refresh() {
		try {
			const { user } = await api.me();
			setUser(user);
		} catch {
			setUser(null); // Tidak ada sesi atau error
		} finally {
			setLoading(false);
		}
	}

	/** Logout: panggil API logout lalu bersihkan state lokal */
	async function logout() {
		await api.logout();
		setUser(null);
	}

	// Muat sesi saat komponen pertama kali dimount
	useEffect(() => {
		void refresh();
	}, []);

	return (
		<Ctx.Provider value={{ user, loading, refresh, logout }}>
			{children}
		</Ctx.Provider>
	);
}

/**
 * useAuth — Hook untuk mengakses konteks autentikasi.
 *
 * Contoh penggunaan:
 * ```tsx
 * const { user, logout } = useAuth();
 * if (!user) return <LoginPage />;
 * ```
 */
export function useAuth() {
	return useContext(Ctx);
}
