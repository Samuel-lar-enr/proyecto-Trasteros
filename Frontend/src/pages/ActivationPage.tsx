import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../services/api';

type ActivationStatus = 'loading' | 'success' | 'error';

const ActivationPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<ActivationStatus>('loading');
  const [message, setMessage] = useState('Verificando cuenta...');

  useEffect(() => {
    const runActivation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de activacion no valido.');
        return;
      }

      try {
        const response = await authService.activateAccount(token);
        setStatus('success');
        setMessage(response.message || 'Cuenta activada exitosamente.');
      } catch (error) {
        setStatus('error');
        if (isAxiosError(error)) {
          setMessage(
            String(
              error.response?.data?.message ??
                'No se pudo activar la cuenta. El enlace puede haber caducado.',
            ),
          );
          return;
        }
        setMessage('No se pudo activar la cuenta.');
      }
    };

    void runActivation();
  }, [token]);

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Verificacion de cuenta</p>
        <h1>Activacion</h1>
        <p className="subtitle">{message}</p>

        {status === 'loading' && <div className="spinner" aria-label="Cargando" />}

        {status === 'success' && (
          <Link className="primary-btn center-link" to="/login">
            Ir al login
          </Link>
        )}

        {status === 'error' && (
          <Link className="secondary-btn center-link" to="/login">
            Volver al login
          </Link>
        )}
      </section>
    </main>
  );
};

export default ActivationPage;
