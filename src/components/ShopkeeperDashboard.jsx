import React, { useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ShopForm from './ShopForm';
import PaymentPage from './PaymentPage';
import OrderList from './OrderList';
import RefillRequests from './RefillRequests'; // New component
import ShopkeeperNotifications from './ShopkeeperNotifications'; // New component

export default function ShopkeeperDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const location = useLocation();

  // Load unread notification count
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const res = await fetch(`/api/notifications/user/${user._id}/unread-count`);
        const data = await res.json();
        setUnreadNotifications(data.count);
      } catch (err) {
        console.error('Error loading notification count:', err);
      }
    };

    loadUnreadCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user._id]);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Welcome, {user.name}! 🏪</h2>
        <div style={styles.headerActions}>
          <Link to="/notifications" style={styles.notificationButton}>
            🔔 {unreadNotifications > 0 && <span style={styles.notificationBadge}>{unreadNotifications}</span>}
          </Link>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <nav style={styles.nav}>
        <Link 
          to="/" 
          style={isActive('/') ? styles.activeNavLink : styles.navLink}
        >
          🏪 My Shop
        </Link>
        <Link 
          to="/refill-requests" 
          style={isActive('/refill-requests') ? styles.activeNavLink : styles.navLink}
        >
          🔔 Refill Requests
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
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/refill-requests" element={<RefillRequests />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/notifications" element={<ShopkeeperNotifications />} />
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  notificationButton: {
    position: 'relative',
    padding: '8px 12px',
    textDecoration: 'none',
    fontSize: '20px'
  },
  notificationBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    fontSize: '12px',
    padding: '2px 6px',
    minWidth: '18px',
    textAlign: 'center'
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
