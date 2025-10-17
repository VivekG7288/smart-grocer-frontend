import React, { useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ShopForm from './ShopForm';
import OrderList from './OrderList';

export default function ShopkeeperDashboard() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Welcome, {user.name}! 🏪</h2>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <nav style={styles.nav}>
        <Link 
          to="/" 
          style={isActive('/') ? styles.activeNavLink : styles.navLink}
        >
          🏪 My Shop
        </Link>
        <Link 
          to="/orders" 
          style={isActive('/orders') ? styles.activeNavLink : styles.navLink}
        >
          📦 Orders
        </Link>
      </nav>

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<ShopForm />} />
          <Route path="/orders" element={<OrderList />} />
        </Routes>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  nav: {
    display: 'flex',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    padding: '0 20px'
  },
  navLink: {
    padding: '15px 20px',
    textDecoration: 'none',
    color: '#666',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s'
  },
  activeNavLink: {
    padding: '15px 20px',
    textDecoration: 'none',
    color: '#007bff',
    borderBottom: '3px solid #007bff',
    fontWeight: 'bold'
  },
  content: {
    padding: '20px'
  }
};
