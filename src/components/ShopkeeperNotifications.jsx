import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { AuthContext } from '../contexts/AuthContext';

export default function ShopkeeperNotifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get(`/notifications/user/${user._id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading notifications...</div>;
  }

  return (
    <div style={styles.container}>
      <h3>🔔 Shop Notifications</h3>
      
      {notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No notifications yet!</p>
          <p>You'll get notified when customers request refills.</p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              style={notification.isRead ? styles.readNotification : styles.unreadNotification}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div style={styles.notificationHeader}>
                <h4>{notification.title}</h4>
                <span style={styles.timestamp}>
                  {new Date(notification.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p>{notification.message}</p>
              {notification.metadata && (
                <div style={styles.metadata}>
                  <p><strong>Customer:</strong> {notification.metadata.customerName}</p>
                  <p><strong>Product:</strong> {notification.metadata.productName}</p>
                  <p><strong>Quantity:</strong> {notification.metadata.quantity}</p>
                </div>
              )}
              {notification.actionRequired && (
                <div style={styles.actionRequired}>
                  ⚡ Action Required - Check Refill Requests
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '50px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#666'
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  unreadNotification: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer'
  },
  readNotification: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px'
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  timestamp: {
    fontSize: '12px',
    color: '#666'
  },
  metadata: {
    marginTop: '10px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  actionRequired: {
    marginTop: '10px',
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    textAlign: 'center'
  }
};
