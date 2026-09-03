/**
 * ProfilePage.tsx — Halaman Profil Pengguna
 *
 * Menampilkan dan mengedit data profil pegawai.
 *
 * Fitur:
 * 1. Identitas Kepegawaian:
 *    - Lihat nama dan email (read-only)
 *    - Edit NIP (harus unik, 17-18 digit angka)
 *    - Edit jabatan (maks 120 karakter)
 *    - Validasi: NIP tidak boleh sama dengan pengguna lain
 *
 * 2. Ganti Password:
 *    - Password saat ini (diperlukan kecuali admin mereset)
 *    - Password baru (min 8 karakter, harus ada huruf dan angka)
 *    - Ulangi password baru
 *    - Jika admin mereset, password saat ini tidak diperlukan
 *
 * 3. Info forced password change:
 *    - Banner peringatan jika admin mereset password
 *    - Pengguna wajib ganti password sebelum bisa mengakses halaman lain
 */

import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Banner, Button, Card, Field, PageHeader } from "../components/ui";
import { useToast } from "../toast";

export function ProfilePage() {
	const toast = useToast();
	const { user, refresh } = useAuth();

	// State form profil
	const [nip, setNip] = useState("");
	const [jabatan, setJabatan] = useState("");
	const [profileErr, setProfileErr] = useState("");
	const [profileBusy, setProfileBusy] = useState(false);

	// State form ganti password
	const [current, setCurrent] = useState(""); // Password saat ini
	const [next, setNext] = useState(""); // Password baru
	const [again, setAgain] = useState(""); // Ulangi password baru
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);

	// Apakah pengguna wajib ganti password (admin reset)
	const forced = Boolean(user?.mustChangePassword);

	// Isi form profil dengan data saat ini
	useEffect(() => {
		setNip(user?.nip ?? "");
		setJabatan(user?.jabatan ?? "");
	}, [user?.id, user?.nip, user?.jabatan]);

	// Cek apakah ada perubahan pada form profil
	const profileDirty =
		(user?.nip ?? "") !== nip.trim() ||
		(user?.jabatan ?? "") !== jabatan.trim();

	/**
	 * Simpan perubahan profil (NIP dan jabatan).
	 * Validasi dilakukan di server.
	 */
	async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setProfileErr("");
		setProfileBusy(true);
		try {
			await api.updateProfile(nip, jabatan);
			await refresh(); // Muat ulang data sesi
			toast.push("NIP dan jabatan disimpan");
		} catch (ex) {
			setProfileErr((ex as Error).message);
		} finally {
			setProfileBusy(false);
		}
	}

	/**
	 * Ganti password.
	 * Validasi:
	 * - Konfirmasi password harus sama
	 * - Password saat ini diperlukan (kecuali forced)
	 * - Password baru harus memenuhi syarat (min 8, huruf + angka)
	 */
	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setErr("");
		if (next !== again) {
			setErr("Konfirmasi password baru tidak sama");
			return;
		}
		setBusy(true);
		try {
			// Jika forced, tidak perlu current password
			await api.changePassword(next, forced ? undefined : current);
			await refresh();
			setCurrent("");
			setNext("");
			setAgain("");
			toast.push("Password berhasil diganti");
		} catch (ex) {
			setErr((ex as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title="Profil"
				sub="Perbarui identitas kepegawaian dan ganti password."
			/>
			{forced ? (
				<Banner>
					Admin mereset password Anda. Ganti password default sebelum lanjut.
				</Banner>
			) : null}
			<Card>
				<h2 className="font-semibold">Identitas kepegawaian</h2>
				<p className="ui-sub">
					Nama dan email tidak diubah di sini. NIP harus unik di seluruh
					pengguna.
				</p>
				<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
					<div className="rounded-xl bg-slate-50 px-3 py-2.5">
						<dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
							Nama
						</dt>
						<dd className="mt-0.5 font-medium">{user?.fullName}</dd>
					</div>
					<div className="rounded-xl bg-slate-50 px-3 py-2.5">
						<dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
							Email
						</dt>
						<dd className="mt-0.5">{user?.email}</dd>
					</div>
				</dl>
				<form onSubmit={(e) => void saveProfile(e)} className="mt-4 space-y-3">
					<div className="grid gap-3 sm:grid-cols-2">
						<Field label="NIP" hint="17 atau 18 digit. Hanya angka.">
							<input
								className="ui-input font-mono tracking-wide"
								inputMode="numeric"
								autoComplete="off"
								value={nip}
								onChange={(e) =>
									setNip(e.target.value.replace(/\D/g, "").slice(0, 18))
								}
								placeholder="198001012006041001"
							/>
						</Field>
						<Field label="Jabatan" hint="Contoh: Analis Kebijakan Ahli Muda">
							<input
								className="ui-input"
								value={jabatan}
								onChange={(e) => setJabatan(e.target.value.slice(0, 120))}
								placeholder="Jabatan"
							/>
						</Field>
					</div>
					{profileErr ? <Banner tone="error">{profileErr}</Banner> : null}
					<div className="flex flex-wrap items-center gap-2">
						<Button disabled={profileBusy || !profileDirty}>
							{profileBusy ? "Menyimpan…" : "Simpan identitas"}
						</Button>
						{profileDirty ? (
							<Button
								type="button"
								variant="quiet"
								onClick={() => {
									setNip(user?.nip ?? "");
									setJabatan(user?.jabatan ?? "");
									setProfileErr("");
								}}
							>
								Batalkan
							</Button>
						) : null}
					</div>
				</form>
				<p className="mt-3 text-xs text-ink-faint">
					Peran saat ini: {(user?.roles ?? []).join(", ") || "—"}
				</p>
			</Card>
			<Card>
				<h2 className="font-semibold">Ganti password</h2>
				<form
					onSubmit={(e) => void submit(e)}
					className="mt-4 max-w-md space-y-3"
				>
					{!forced ? (
						<Field label="Password saat ini">
							<input
								className="ui-input"
								type="password"
								autoComplete="current-password"
								value={current}
								onChange={(e) => setCurrent(e.target.value)}
							/>
						</Field>
					) : null}
					<Field label="Password baru">
						<input
							className="ui-input"
							type="password"
							autoComplete="new-password"
							value={next}
							onChange={(e) => setNext(e.target.value)}
						/>
					</Field>
					<Field label="Ulangi password baru">
						<input
							className="ui-input"
							type="password"
							autoComplete="new-password"
							value={again}
							onChange={(e) => setAgain(e.target.value)}
						/>
					</Field>
					{err ? <Banner tone="error">{err}</Banner> : null}
					<Button disabled={busy}>
						{busy ? "Menyimpan…" : "Simpan password"}
					</Button>
				</form>
				<p className="mt-3 text-xs text-ink-faint">
					Minimal 8 karakter, harus ada huruf dan angka.
				</p>
			</Card>
		</div>
	);
}
