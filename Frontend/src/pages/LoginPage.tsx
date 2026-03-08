import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/context';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setErrorMessage('Error en la identificación');
        } else if (error.response.status === 403) {
          setErrorMessage(
            String(
              error.response.data?.message ??
                'Tu cuenta no esta activada. Revisa tu email para activarla.',
            ),
          );
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

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Acceso Boxen</p>
        <h1>Iniciar sesion</h1>
        <p className="subtitle">Accede con tu usuario y contrasena.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Usuario (email)</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {errorMessage && <p className="error-text">{errorMessage}</p>}

          <button className="primary-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button className="secondary-btn" type="button" disabled>
          Continuar con Google (proximamente)
        </button>

        <nav className="auth-links" aria-label="Enlaces de acceso">
          <Link to="/register">Crear usuario</Link>
          <Link to="/forgot-password">Recuperar contrasena</Link>
        </nav>
      </section>
    </main>
  );
};

export default LoginPage;
