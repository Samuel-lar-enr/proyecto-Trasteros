import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import { TrasterosProvider } from './contexts/TrasterosContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { ContractProvider } from './contexts/ContractContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ActivationPage from './pages/auth/ActivationPage';
import DashboardPage from './pages/main/DashboardPage';
import AdminDashboard from './pages/main/AdminDashboard';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import MarketingPolicyPage from './pages/legal/MarketingPolicyPage';
import TrasterosList from './pages/storage/TrasterosList';
import TrasteroDetail from './pages/storage/TrasteroDetail';
import CreateTrastero from './pages/storage/CreateTrastero';
import EditTrastero from './pages/storage/EditTrastero';
import StorageUnitInvoices from './pages/invoice/StorageUnitInvoices';
import InvoiceDetail from './pages/invoice/InvoiceDetail';
import InvoiceManagement from './pages/invoice/InvoiceManagement';
import InvoiceForm from './pages/invoice/InvoiceForm';

const App = () => {
  return (
    <AuthProvider>
      <TrasterosProvider>
        <InvoiceProvider>
          <ContractProvider>
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
            <Route
              path="/trasteros/:id/invoices"
              element={
                <ProtectedRoute>
                  <StorageUnitInvoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/manage"
              element={
                <AdminProtectedRoute>
                  <InvoiceManagement />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/invoices/create"
              element={
                <AdminProtectedRoute>
                  <InvoiceForm />
                </AdminProtectedRoute>
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
          </ContractProvider>
        </InvoiceProvider>
      </TrasterosProvider>
    </AuthProvider>
  );
};

export default App;