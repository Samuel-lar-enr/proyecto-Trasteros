import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/context';
import LoginPage from './pages/LoginPage';
import ActivationPage from './pages/ActivationPage';
import DashboardPage from './pages/DashboardPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate/:token" element={<ActivationPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PlaceholderPage
                title="Registro"
                message="La pantalla de registro la implementamos en el siguiente paso."
              />
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PlaceholderPage
                title="Recuperar contrasena"
                message="Esta opcion se conectara al login unico en la siguiente iteracion."
              />
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;