import AuthLayout from '../components/AuthLayout';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
    return (
        <AuthLayout encabezado="Acceso Boxen" titulo="Política de Privacidad" subtitulo="Tu privacidad es importante para nosotros.">
            <div style={{ color: '#4b5563', fontSize: '0.925rem', lineHeight: '1.6', textAlign: 'justify' }}>
                <p style={{ marginBottom: '1rem' }}>
                    Esta Política de Privacidad describe cómo recogemos, utilizamos y protegemos tu información personal cuando utilizas nuestro servicio.
                </p>
                
                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    1. Datos que recogemos
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    Recogemos los datos básicos necesarios para el funcionamiento del servicio: nombre, dirección de email y contraseña (encriptada).
                </p>

                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    2. Uso de la información
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    La información se utiliza exclusivamente para gestionar tu cuenta, permitirte el acceso al servicio y enviarte comunicaciones importantes relacionadas con tu trastero o cuenta.
                </p>

                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    3. Protección de datos
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    Implementamos medidas de seguridad robustas para proteger tus datos contra accesos no autorizados. No vendemos ni compartimos tus datos con terceros para fines comerciales.
                </p>
            </div>

            <nav className="auth-links" aria-label="Enlaces de navegación">
                <Link to="/register">Volver al registro</Link>
            </nav>
        </AuthLayout>
    );
};

export default PrivacyPolicyPage;
