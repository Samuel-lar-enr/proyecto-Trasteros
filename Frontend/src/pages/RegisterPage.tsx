import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/context';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthLayout from '../components/AuthLayout';
import { authService } from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const validateForm = (): boolean => {
        if (!email || !password || !confirmPassword || !name) {
            setErrorMessage('Todos los campos son requeridos');
            return false;
        }

        if (password.length < 6) {
            setErrorMessage('La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden');
            return false;
        }

        if (name.trim().length < 2) {
            setErrorMessage('El nombre debe tener al menos 2 caracteres');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        try {
            await authService.register({
                email,
                password,
                name,
            });

            setSuccessMessage(
                'Registro exitoso. Por favor, revisa tu email para activar tu cuenta.'
            );

            // Limpiar el formulario
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setName('');

            // Redirigir a login después de 3 segundos
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                if (error.response.status === 409) {
                    setErrorMessage('El email ya está registrado');
                } else {
                    setErrorMessage(
                        String(error.response.data?.message ?? 'No se pudo completar el registro.')
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
        <AuthLayout encabezado="Acceso Boxen" titulo="Crear cuenta" subtitulo="Completa el formulario para registrarte.">
            {successMessage && (
                <div style={{ padding: '12px 16px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', marginBottom: '16px' }}>
                    {successMessage}
                </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
                <Input
                    id="name"
                    label="Nombre completo"
                    type="text"
                    autoComplete="name"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                />

                <Input
                    id="email"
                    label="Email"
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
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <Input
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    error={errorMessage}
                />

                <Button type="submit" isLoading={isSubmitting}>
                    Crear cuenta
                </Button>
            </form>

            <Button variant="secondary" type="button" disabled>
                Continuar con Google (próximamente)
            </Button>

            <nav className="auth-links" aria-label="Enlaces de acceso">
                <Link to="/login">Volver a iniciar sesión</Link>
            </nav>
        </AuthLayout>
    );
};

export default RegisterPage;