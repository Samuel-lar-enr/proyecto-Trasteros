import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

type AdminProtectedRouteProps = {
  children: ReactNode;
};

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  // Si no requiere autenticación, permitir acceso directo
  const requireAuth = import.meta.env.VITE_REQUIRE_AUTH;
  if (requireAuth === 'false') {
    return <>{children}</>;
  }

  if (isBootstrapping) {
    return <div className="centered-card">Cargando sesion...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
