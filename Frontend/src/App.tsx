import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import { TrasterosProvider } from './contexts/TrasterosContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ActivationPage from './pages/ActivationPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import MarketingPolicyPage from './pages/MarketingPolicyPage';
import TrasterosList from './pages/TrasterosList';
import TrasteroDetail from './pages/TrasteroDetail';
import CreateTrastero from './pages/CreateTrastero';
import EditTrastero from './pages/EditTrastero';

const App = () => {
  return (
    <AuthProvider>
      <TrasterosProvider>
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
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/trasteros"
            element={
              <ProtectedRoute>
                <TrasterosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trasteros/create"
            element={
              <AdminProtectedRoute>
                <CreateTrastero />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/trasteros/:id/edit"
            element={
              <AdminProtectedRoute>
                <EditTrastero />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/trasteros/:id"
            element={
              <ProtectedRoute>
                <TrasteroDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/marketing-policy" element={<MarketingPolicyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/" element={<Navigate to="/trasteros" replace />} />
          <Route path="*" element={<Navigate to="/trasteros" replace />} />
        </Routes>
        </BrowserRouter>
      </TrasterosProvider>
    </AuthProvider>
  );
};

export default App;