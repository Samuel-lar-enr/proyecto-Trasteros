import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../contexts/context';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccountNotActivated, setIsAccountNotActivated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsAccountNotActivated(false);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setErrorMessage(
            String(error.response.data?.message ?? 'Error en la identificación')
          );
        } else if (error.response.status === 403) {
          setErrorMessage(
            String(
              error.response.data?.message ??
              'Tu cuenta no esta activada. Revisa tu email para activarla.',
            ),
          );
          setIsAccountNotActivated(true);
        } else {
          setErrorMessage(
            String(error.response.data?.message ?? 'No se pudo iniciar sesion.'),
          );
        }
      } else {
        setErrorMessage('No se pudo conectar con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendActivation = async () => {
    if (!email) return;

    try {
      await authService.resendActivation({ email });
      setSuccessMessage('Email de activación reenviado con éxito.');
      setErrorMessage('');
      setIsAccountNotActivated(false);
    } catch (error) {
      setErrorMessage('Error al reenviar el email.');
    }
  };

  return (
    <AuthLayout encabezado="Acceso Boxen" titulo="Iniciar sesión" subtitulo="Accede con tu usuario y contraseña.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Usuario (email)"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          error={errorMessage}
        />

        <Button type="submit" isLoading={isSubmitting}>Entrar</Button>
      </form>

      {successMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '4px', marginTop: '16px', fontSize: '0.875rem', border: '1px solid #a7f3d0' }}>
          <p>{successMessage}</p>
        </div>
      )}

      {isAccountNotActivated && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fff7ed', color: '#9a3412', borderRadius: '4px', marginTop: '16px', fontSize: '0.875rem', border: '1px solid #fed7aa' }}>
          <p>¿No has recibido el email de activación?</p>
          <button 
            onClick={handleResendActivation}
            style={{ background: 'none', border: 'none', color: '#c2410c', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '8px', fontSize: '0.875rem' }}
          >
            Reenviar enlace de activación
          </button>
        </div>
      )}

      <Button variant="secondary" type="button" disabled>Continuar con Google (próximamente)</Button>

      <nav className="auth-links" aria-label="Enlaces de acceso">
        <Link to="/register">Crear usuario</Link>
        <Link to="/forgot-password">Recuperar contraseña</Link>
      </nav>
    </AuthLayout>
  );
};

export default LoginPage;
