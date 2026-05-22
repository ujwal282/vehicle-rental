import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Car, TrendingUp, BarChart2, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand">
          <Car size={24} style={{ strokeWidth: 2.5 }} />
          <span>VEHICLE.RENT</span>
        </Link>

        <div className="nav-links">
          {(!user || user.role !== 'admin') && (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                Vehicles
              </NavLink>

              <NavLink to="/locations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Branches
              </NavLink>
            </>
          )}

          {user ? (
            <>
              {user.role !== 'admin' && (
                <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  My Bookings
                </NavLink>
              )}

              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} />
                    <span>Admin</span>
                  </NavLink>
                  <NavLink to="/vehiclelist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Car size={14} />
                    <span>Vehicles</span>
                  </NavLink>
                  <NavLink to="/earnings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} />
                    <span>Earnings</span>
                  </NavLink>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="Logout">
                  <LogOut size={12} />
                  <span>Exit</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Register</Link>
            </div>
          )}

          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
