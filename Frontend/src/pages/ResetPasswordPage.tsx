import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { authService } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: 'Token de recuperación no encontrado.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await authService.resetPassword(token, { password });
      setMessage({
        type: 'success',
        text: response.message || 'Tu contraseña ha sido actualizada correctamente.'
      });
      // Redirigir al login después de 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        setMessage({
          type: 'error',
          text: error.response.data?.message || 'Hubo un error al restablecer tu contraseña.'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'No se pudo conectar con el servidor.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      encabezado="Acceso Boxen" 
      titulo="Nueva contraseña" 
      subtitulo="Introduce tu nueva contraseña de acceso."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          id="password"
          label="Nueva Contraseña"
          type="password"
          placeholder="********"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Input
          id="confirmPassword"
          label="Confirmar Contraseña"
          type="password"
          placeholder="********"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          error={message?.type === 'error' ? message.text : undefined}
        />

        {message?.type === 'success' && (
          <p className="success-message" style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {message.text} Redirigiendo al inicio de sesión...
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Restablecer contraseña
        </Button>
      </form>

      <nav className="auth-links" aria-label="Enlaces de acceso">
        <Link to="/login">Volver al inicio de sesión</Link>
      </nav>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
