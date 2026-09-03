/**
 * toast.ts — Sistem Notifikasi Toast
 *
 * Menyediakan notifikasi sementara (toast) yang muncul di pojok kanan bawah layar.
 *
 * Fitur:
 * - ToastProvider: membungkus aplikasi dan menyediakan fungsi push()
 * - useToast: hook untuk menampilkan toast dari komponen mana pun
 *
 * Jenis toast:
 * - success (default): notifikasi sukses (warna hijau)
 * - error: notifikasi error (warna merah)
 *
 * Perilaku:
 * - Maksimal 3 toast terlihat sekaligus (sisanya ditumpuk)
 * - Toast otomatis menghilang setelah 3.2 detik
 * - Animasi: muncul dari bawah dengan transisi
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

/** Tipe toast: success atau error */
type Tone = "success" | "error";

/** Item toast: id unik, pesan, dan tipe */
type Item = { id: number; message: string; tone: Tone };

/** Context toast */
const Ctx = createContext<{
	push: (message: string, tone?: Tone) => void;
}>({ push: () => {} });

/** Counter untuk generate ID unik toast */
let seq = 0;

/**
 * ToastProvider — Komponen pembungkus yang menyediakan fungsi push().
 *
 * State:
 * - items: array toast yang sedang aktif (maks 4, tapi yang ditampilkan maks 3)
 *
 * Fungsi push():
 * - Membuat toast baru dengan ID unik
 * - Menambahkan ke array items (maks 4 item terakhir)
 * - Mengatur timer 3.2 detik untuk menghapus toast
 */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<Item[]>([]);

	const push = useCallback((message: string, tone: Tone = "success") => {
		const id = ++seq;
		// Simpan maks 4 toast terakhir (yang ditampilkan maks 3)
		setItems((list) => [...list.slice(-3), { id, message, tone }]);
		// Auto-dismiss setelah 3.2 detik
		window.setTimeout(() => {
			setItems((list) => list.filter((t) => t.id !== id));
		}, 3200);
	}, []);

	return (
		<Ctx.Provider value={{ push }}>
			{children}
			{/* Stack toast di pojok kanan bawah */}
			<div className="ui-toast-stack" role="status" aria-live="polite">
				{items.map((t) => (
					<div
						key={t.id}
						className={`ui-toast ${t.tone === "error" ? "ui-toast-error" : "ui-toast-ok"}`}
					>
						{t.message}
					</div>
				))}
			</div>
		</Ctx.Provider>
	);
}

/**
 * useToast — Hook untuk menampilkan toast.
 *
 * Contoh penggunaan:
 * ```tsx
 * const toast = useToast();
 * toast.push("Data tersimpan");
 * toast.push("Terjadi error", "error");
 * ```
 */
export function useToast() {
	return useContext(Ctx);
}
