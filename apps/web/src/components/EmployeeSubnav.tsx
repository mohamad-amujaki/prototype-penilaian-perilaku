import { NavLink } from "react-router-dom";

export function EmployeeSubnav() {
  const cls = ({ isActive }: { isActive: boolean }) => `ui-btn shrink-0 flex-1 ${isActive ? "bg-brand text-white" : "text-ink-muted"}`;
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
