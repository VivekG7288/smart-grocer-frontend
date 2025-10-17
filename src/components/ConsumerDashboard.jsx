import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import AddressSelector from './AddressSelector';
import ShopList from './ShopList';
import ProductList from './ProductList';
import Cart from './Cart';
import OrderHistory from './OrderHistory';

export default function ConsumerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const location = useLocation();

  const handleAddressConfirmed = (address) => {
    setDeliveryAddress(address);
    // Save to localStorage for persistence
    localStorage.setItem(`deliveryAddress_${user._id}`, JSON.stringify(address));
  };

  const changeLocation = () => {
    setDeliveryAddress(null);
    localStorage.removeItem(`deliveryAddress_${user._id}`);
  };

  // Check for saved address on load
  React.useEffect(() => {
    const savedAddress = localStorage.getItem(`deliveryAddress_${user._id}`);
    if (savedAddress) {
      setDeliveryAddress(JSON.parse(savedAddress));
    }
  }, [user._id]);

  const isActive = (path) => location.pathname === path;

  // Show address selector if no address is set
  if (!deliveryAddress) {
    return <AddressSelector onAddressConfirmed={handleAddressConfirmed} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.locationInfo}>
          <h2>Welcome, {user.name}! 🛍️</h2>
          <div style={styles.deliveryAddress}>
            <span>📍 Delivering to: {deliveryAddress.area}, {deliveryAddress.city}</span>
            <button onClick={changeLocation} style={styles.changeLocationButton}>
              Change
            </button>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <nav style={styles.nav}>
        <Link 
          to="/" 
          style={isActive('/') ? styles.activeNavLink : styles.navLink}
        >
          🏪 Nearby Shops
        </Link>
        <Link 
          to="/cart" 
          style={isActive('/cart') ? styles.activeNavLink : styles.navLink}
        >
          🛒 Cart
        </Link>
        <Link 
          to="/orders" 
          style={isActive('/orders') ? styles.activeNavLink : styles.navLink}
        >
          📋 Orders
        </Link>
      </nav>

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<ShopList deliveryAddress={deliveryAddress} />} />
          <Route path="/shop/:shopId" element={<ProductList />} />
          <Route path="/cart" element={<Cart deliveryAddress={deliveryAddress} />} />
          <Route path="/orders" element={<OrderHistory />} />
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
  locationInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  deliveryAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#666'
  },
  changeLocationButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
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
