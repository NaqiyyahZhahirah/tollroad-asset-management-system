import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './utils/leafletIconFix';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AsetList from './pages/AsetList';
import AsetForm from './pages/AsetForm';
import AsetDetail from './pages/AsetDetail';
import PetaMonitoring from './pages/PetaMonitoring';
import KategoriManagement from './pages/KategoriManagement';
import UserManagement from './pages/UserManagement';
import ReferensiJalanList from './pages/ReferensiJalanList';
import ReferensiJalanForm from './pages/ReferensiJalanForm';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';

function App() {
    useEffect(() => {
        function handleWheel() {
            if (document.activeElement && document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        }
        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/aset" element={<ProtectedRoute><AsetList /></ProtectedRoute>} />
                    <Route path="/aset/tambah" element={<ProtectedRoute><AsetForm /></ProtectedRoute>} />
                    <Route path="/aset/edit/:id" element={<ProtectedRoute><AsetForm /></ProtectedRoute>} />
                    <Route path="/aset/:id" element={<ProtectedRoute><AsetDetail /></ProtectedRoute>} />
                    <Route path="/peta" element={<ProtectedRoute><PetaMonitoring /></ProtectedRoute>} />
                    <Route
                        path="/kategori"
                        element={
                            <ProtectedRoute adminOnly>
                                <KategoriManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/pengguna"
                        element={
                            <ProtectedRoute adminOnly>
                                <UserManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/referensi-jalan"
                        element={
                            <ProtectedRoute adminOnly>
                                <ReferensiJalanList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/referensi-jalan/tambah"
                        element={
                            <ProtectedRoute adminOnly>
                                <ReferensiJalanForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/referensi-jalan/edit/:id"
                        element={
                            <ProtectedRoute adminOnly>
                                <ReferensiJalanForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;