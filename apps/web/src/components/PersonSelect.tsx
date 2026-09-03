/**
 * PersonSelect.tsx — Dropdown Pencarian Orang
 *
 * Komponen dropdown yang bisa mencari pengguna berdasarkan nama, NIP, atau jabatan.
 * Digunakan di halaman admin untuk memilih atasan/penilai.
 *
 * Fitur:
 * - Pencarian real-time saat mengetik
 * - Mengecualikan pengguna tertentu (excludeId) - misal: tidak boleh menilai diri sendiri
 * - Tombol "Lepas atasan" untuk menghapus penugasan
 * - Auto-focus ke input pencarian saat dropdown dibuka
 * - Tutup otomatis saat klik di luar atau tekan Escape
 * - Maksimal 80 hasil ditampilkan (untuk performa)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { UserRow } from "../api";

/** Simple debounce hook */
function useDebounce<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

export function PersonSelect({
	users,
	value,
	excludeId,
	disabled,
	placeholder = "Pilih atasan",
	onChange,
}: {
	users: UserRow[]; // Daftar semua pengguna
	value: string; // ID pengguna yang dipilih saat ini
	excludeId?: string; // ID yang tidak boleh dipilih (diri sendiri)
	disabled?: boolean; // Nonaktifkan dropdown
	placeholder?: string; // Teks placeholder
	onChange: (id: string) => void; // Callback saat pilihan berubah
}) {
	const [open, setOpen] = useState(false); // Status dropdown
	const [q, setQ] = useState(""); // Query pencarian
	const debouncedQ = useDebounce(q, 150); // Debounce 150ms untuk performa
	const root = useRef<HTMLDivElement>(null); // Ref untuk deteksi klik di luar
	const searchRef = useRef<HTMLInputElement>(null); // Ref untuk auto-focus

	// Pengguna yang sedang dipilih
	const selected = users.find((u) => u.id === value);

	// Filter pengguna berdasarkan query dan excludeId
	const options = useMemo(() => {
		const s = debouncedQ.trim().toLowerCase();
		return users
			.filter((u) => u.id !== excludeId) // Kecualikan ID tertentu
			.filter((u) => {
				if (!s) return true;
				// Cari di nama, NIP, atau jabatan
				return (
					u.fullName.toLowerCase().includes(s) ||
					(u.nip ?? "").includes(s) ||
					(u.jabatan ?? "").toLowerCase().includes(s)
				);
			})
			.slice(0, 80); // Batasi 80 hasil untuk performa
	}, [users, excludeId, debouncedQ]);

	// Tutup dropdown saat klik di luar atau tekan Escape
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

	// Auto-focus ke input pencarian saat dropdown dibuka
	useEffect(() => {
		if (open) {
			setQ("");
			window.setTimeout(() => searchRef.current?.focus(), 20);
		}
	}, [open]);

	return (
		<div className="relative min-w-[12rem] max-w-xs" ref={root}>
			{/* Tombol trigger dropdown */}
			<button
				type="button"
				disabled={disabled}
				className="ui-input mt-0 flex w-full items-center justify-between gap-2 py-1.5 text-left"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				<span className={selected ? "truncate" : "truncate text-ink-faint"}>
					{selected ? selected.fullName : placeholder}
				</span>
				<span className="text-ink-faint">▾</span>
			</button>

			{/* Dropdown menu */}
			{open ? (
				<div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-lift">
					{/* Input pencarian */}
					<input
						ref={searchRef}
						className="ui-input mt-0 rounded-none border-0 shadow-none"
						placeholder="Cari nama atau NIP"
						value={q}
						onChange={(e) => setQ(e.target.value)}
					/>
					{/* Daftar hasil */}
					<ul className="max-h-56 overflow-auto py-1">
						{/* Opsi "Lepas atasan" */}
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
						{/* Hasil pencarian */}
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
						{/* Pesan jika tidak ada hasil */}
						{!options.length ? (
							<li className="px-3 py-2 text-xs text-ink-faint">
								Tidak ada hasil
							</li>
						) : null}
					</ul>
				</div>
			) : null}
		</div>
	);
}
