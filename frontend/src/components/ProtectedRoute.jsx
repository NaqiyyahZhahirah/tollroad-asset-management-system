import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { token, user, isSessionValid, logout } = useAuthStore();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!isSessionValid()) {
        logout();
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}