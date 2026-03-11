import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
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

      <Button variant="secondary" type="button" disabled>Continuar con Google (próximamente)</Button>

      <nav className="auth-links" aria-label="Enlaces de acceso">
        <Link to="/register">Crear usuario</Link>
        <Link to="/forgot-password">Recuperar contraseña</Link>
      </nav>
    </AuthLayout>
  );
};

export default LoginPage;
