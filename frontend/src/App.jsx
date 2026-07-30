import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './utils/leafletIconFix';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AsetList from './pages/AsetList';
import AsetForm from './pages/AsetForm';
import AsetDetail from './pages/AsetDetail';
import PetaMonitoring from './pages/PetaMonitoring';
import KategoriManagement from './pages/KategoriManagement';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/aset" element={<ProtectedRoute><AsetList /></ProtectedRoute>} />
                <Route path="/aset/tambah" element={<ProtectedRoute><AsetForm /></ProtectedRoute>} />
                <Route path="/peta" element={<ProtectedRoute><PetaMonitoring /></ProtectedRoute>} />
                <Route
                    path="/kategori"
                    element={
                        <ProtectedRoute adminOnly>
                            <KategoriManagement />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;