import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LibraryDetailPage from './pages/LibraryDetailPage'
import RiwayatPage from './pages/RiwayatPage'
import ProfilePage from './pages/ProfilePage'
import UserManagementPage from './pages/UserManagementPage'
import CatalogPage from './pages/CatalogPage'
import CatalogDetailPage from './pages/CatalogDetailPage'
import PeminjamanSayaPage from './pages/PeminjamanSayaPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/katalog" element={<CatalogPage />} />
          <Route path="/katalog/:id" element={<CatalogDetailPage />} />
          <Route path="/peminjaman-saya" element={<PeminjamanSayaPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<RoleRoute allow={['admin', 'petugas']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:id" element={<LibraryDetailPage />} />
            <Route path="/riwayat" element={<RiwayatPage />} />
          </Route>

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/akun" element={<UserManagementPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
