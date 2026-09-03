/**
 * EmployeeSubnav.tsx — Navigasi Tab untuk Halaman Pegawai
 *
 * Menampilkan 2 tab navigasi:
 * 1. "Hasil penilaian" → /pegawai (halaman utama dengan radar chart)
 * 2. "Format BerAKHLAK" → /pegawai/berakhlak (tabel format KemenPANRB untuk cetak)
 *
 * Digunakan di: EmployeePage dan EmployeeBerakhlakPage
 */

import { NavLink } from "react-router-dom";

export function EmployeeSubnav() {
	// Fungsi untuk menghasilkan className NavLink
	const cls = ({ isActive }: { isActive: boolean }) =>
		`ui-btn shrink-0 flex-1 ${isActive ? "bg-brand text-white" : "text-ink-muted"}`;

	return (
		<div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-surface print:hidden">
			<NavLink to="/pegawai" end className={cls}>
				Hasil penilaian
			</NavLink>
			<NavLink to="/pegawai/berakhlak" className={cls}>
				Format BerAKHLAK
			</NavLink>
		</div>
	);
}
