import { NILAI_CODES, calculateScores, type NilaiCode } from "@app/shared";
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

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-ink-muted">Memuat…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && loc.pathname !== "/profil") return <Navigate to="/profil" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (user.roles.includes("leadership")) return <Navigate to="/pimpinan" replace />;
  if (user.roles.includes("assessor")) return <Navigate to="/penilai" replace />;
  return <Navigate to="/pegawai" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="/penilai/:assignmentId" element={<AssessorFormPage />} />
          <Route path="/pegawai" element={<EmployeePage />} />
          <Route path="/pegawai/berakhlak" element={<EmployeeBerakhlakPage />} />
          <Route path="/pimpinan" element={<LeadershipPage />} />
          <Route path="/profil" element={<ProfilePage />} />
        </Route>
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export function ScorePreview({ scores }: { scores: Record<string, number> }) {
  try {
    const s = Object.fromEntries(NILAI_CODES.map((c) => [c, Number(scores[c])])) as Record<NilaiCode, number>;
    if (NILAI_CODES.some((c) => !s[c])) return null;
    const calc = calculateScores(s);
    return (
      <div className="ui-card text-sm">
        <div className="font-semibold text-brand">Ringkasan</div>
        <p className="mt-2 text-ink-muted">
          Total {calc.totalScore}/35 · Nilai perilaku {calc.scoreScale120} ({calc.kategoriNilaiPerilaku})
        </p>
        <BudayaRadar ee={calc.budayaEksekusiEfektif} ck={calc.budayaCaraKerjaBaru} pu={calc.budayaPelayananUnggul} />
        <p className="text-ink-muted">Eksekusi Efektif {calc.budayaEksekusiEfektif} ({calc.kategoriEksekusiEfektif})</p>
        <p className="text-ink-muted">Cara Kerja Baru {calc.budayaCaraKerjaBaru} ({calc.kategoriCaraKerjaBaru})</p>
        <p className="text-ink-muted">Pelayanan Unggul {calc.budayaPelayananUnggul} ({calc.kategoriPelayananUnggul})</p>
      </div>
    );
    } catch {
    return null;
  }
}
