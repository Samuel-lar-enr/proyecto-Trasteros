import AuthLayout from '../components/AuthLayout';
import { Link } from 'react-router-dom';

const MarketingPolicyPage = () => {
    return (
        <AuthLayout encabezado="Acceso Boxen" titulo="Política de Comunicaciones" subtitulo="Cómo nos comunicamos contigo.">
            <div style={{ color: '#4b5563', fontSize: '0.925rem', lineHeight: '1.6', textAlign: 'justify' }}>
                <p style={{ marginBottom: '1rem' }}>
                    Al aceptar recibir comunicaciones comerciales, nos autorizas a enviarte información sobre ofertas, promociones y nuevos servicios de Boxen.
                </p>
                
                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    1. Tipos de comunicaciones
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    Podrás recibir boletines informativos, promociones exclusivas para clientes y avisos sobre nuevos trasteros disponibles en tu zona.
                </p>

                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    2. Canales
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    Las comunicaciones se realizarán principalmente a través del correo electrónico proporcionado durante el registro.
                </p>

                <h3 style={{ fontSize: '1.125rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    3. Baja de comunicaciones
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                    Puedes retirar tu consentimiento en cualquier momento haciendo clic en el enlace de "Darse de baja" al final de cualquiera de nuestros correos comerciales o desde tu perfil de usuario.
                </p>
            </div>

            <nav className="auth-links" aria-label="Enlaces de navegación">
                <Link to="/register">Volver al registro</Link>
            </nav>
        </AuthLayout>
    );
};

export default MarketingPolicyPage;
