import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <div className="logo-icon"></div>
          <span>OTP Checkout</span>
        </div>
        <div className="navbar-links">
          <Link 
            to="/checkout" 
            className={`nav-link ${location.pathname === '/checkout' || location.pathname === '/' ? 'active' : ''}`}
          >
            Checkout
          </Link>
          <Link 
            to="/register" 
            className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
