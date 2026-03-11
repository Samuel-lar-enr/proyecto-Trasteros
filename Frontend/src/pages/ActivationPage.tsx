import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';

type ActivationStatus = 'loading' | 'success' | 'error';

const ActivationPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<ActivationStatus>('loading');
  const [message, setMessage] = useState('Verificando cuenta...');

  useEffect(() => {
    const runActivation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de activación no válido.');
        return;
      }

      try {
        const response = await authService.activateAccount(token);
        setStatus('success');
        setMessage(response.message || 'Cuenta activada exitosamente.');
      } catch (error) {
        setStatus('error');
        if (isAxiosError(error)) {
          setMessage(error.response?.data?.message ?? 'No se pudo activar la cuenta. El enlace puede haber caducado.');
          return;
        }
        setMessage('No se pudo activar la cuenta.');
      }
    };

    void runActivation();
  }, [token]);

  return (
    <AuthLayout encabezado="Verificación de cuenta" titulo="Activación" subtitulo={message}>
      {status === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <div className="spinner" aria-label="Cargando" />
        </div>
      )}

      {status === 'success' && (
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button variant="primary">Ir al login</Button>
        </Link>
      )}

      {status === 'error' && (
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button variant="secondary">Volver al login</Button>
        </Link>
      )}
    </AuthLayout>
  );
};

export default ActivationPage;
