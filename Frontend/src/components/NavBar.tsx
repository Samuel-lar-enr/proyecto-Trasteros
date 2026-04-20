import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-link">Página Principal</Link>
        <Link to="/trasteros" className="navbar-link">Trasteros</Link>
      </div>
    </nav>
  );
};

export default NavBar;