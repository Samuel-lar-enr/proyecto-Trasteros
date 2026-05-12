import { Link } from 'react-router-dom';

type PlaceholderPageProps = {
  title: string;
  message: string;
};

const PlaceholderPage = ({ title, message }: PlaceholderPageProps) => {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Modulo en construccion</p>
        <h1>{title}</h1>
        <p className="subtitle">{message}</p>

        <Link className="primary-btn center-link" to="/login">
          Volver al login
        </Link>
      </section>
    </main>
  );
};

export default PlaceholderPage;
