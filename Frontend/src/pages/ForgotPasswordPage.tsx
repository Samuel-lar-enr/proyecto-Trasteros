import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { authService } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [lastRequestedEmail, setLastRequestedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    
    const emailToRequest = lastRequestedEmail || email;
    if (!emailToRequest) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await authService.forgotPassword({ email: emailToRequest });
      setLastRequestedEmail(emailToRequest);
      setMessage({
        type: 'success',
        text: response.message || 'Si el correo está registrado, recibirás un enlace de recuperación pronto.'
      });

      // Redirigir a login después de 15 segundos
      setTimeout(() => {
          navigate('/login');
      }, 15000);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        setMessage({
          type: 'error',
          text: error.response.data?.message || 'Error al procesar la solicitud.'
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
      titulo="Recuperar contraseña" 
      subtitulo="Introduce tu email para enviarte un enlace de recuperación."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          error={message?.type === 'error' ? message.text : undefined}
        />

        {message?.type === 'success' && (
          <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '4px', marginBottom: '16px', fontSize: '0.875rem', border: '1px solid #a7f3d0' }}>
            <p>{message.text}</p>
            <button 
                onClick={() => handleSubmit()}
                type="button"
                style={{ background: 'none', border: 'none', color: '#059669', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '8px', fontSize: '0.75rem' }}
            >
                ¿No has recibido nada? Enviar de nuevo
            </button>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Enviar enlace
        </Button>
      </form>

      <nav className="auth-links" aria-label="Enlaces de acceso">
        <Link to="/login">Volver al inicio de sesión</Link>
      </nav>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
