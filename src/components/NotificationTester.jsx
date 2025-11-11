import React, { useState, useEffect, useContext } from 'react';
import { firebaseMessaging } from '../utils/firebaseMessaging';
import { AuthContext } from '../contexts/AuthContext';

const NotificationTester = () => {
  const [permissionState, setPermissionState] = useState('default');
  const [testResult, setTestResult] = useState(null);

  const resetNotificationPermission = () => {
    // Show instructions for resetting permissions
    setTestResult({
      type: 'info',
      message: 'To reset notification permissions:',
      instructions: [
        '1. Click the lock/info icon in your browser\'s address bar',
        '2. Find "Notifications" in the permissions list',
        '3. Change from "Block" to "Ask" or "Allow"',
        '4. Refresh the page to try again'
      ]
    });
  };

  const { user } = useContext(AuthContext);

  const testNotifications = async () => {
    try {
      setTestResult({ type: 'info', message: 'Requesting notification permission...' });
      
      // Check current permission state
      const currentPermission = Notification.permission;
      setPermissionState(currentPermission);
      
      if (currentPermission === 'denied') {
        setTestResult({
          type: 'error',
          message: 'Notification permission denied.',
          instructions: [
            '1. Click the lock/info icon in your browser\'s address bar',
            '2. Find "Notifications" in the permissions list',
            '3. Change from "Block" to "Ask" or "Allow"',
            '4. Refresh the page to try again'
          ]
        });
        return;
      }

      // Ensure we have a logged-in user id to save the token against
      if (!user || !user._id) {
        setTestResult({ type: 'error', message: 'You must be logged in for the token to be saved to the server.' });
        return;
      }

      // Request permission and get token
      const token = await firebaseMessaging.requestPermission(user._id);
      if (token) {
        setTestResult({ type: 'info', message: 'Got FCM token, sending test notification...' });
        
        // Test sending a notification
        const response = await fetch('https://smart-grocer-backend-1.onrender.com/api/test-notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            title: 'Test Notification',
            body: 'Hello from Smart Grocer! 🛒'
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          setTestResult({ type: 'success', message: 'Notification sent successfully!' });
        } else {
          setTestResult({ 
            type: 'error', 
            message: 'Failed to send notification',
            error: result.error 
          });
        }
      } else {
        setTestResult({ 
          type: 'error', 
          message: 'Failed to get FCM token. Make sure notifications are allowed.' 
        });
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      setTestResult({ type: 'error', message: error.message });
    }
  };

  useEffect(() => {
    testNotifications();
  }, []);

  return (
    <div style={{
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2>Notification Tester</h2>
      
      {testResult && (
        <div style={{
          padding: '15px',
          marginTop: '10px',
          borderRadius: '4px',
          backgroundColor: testResult.type === 'error' ? '#fee2e2' : 
                         testResult.type === 'success' ? '#dcfce7' : 
                         '#e0f2fe',
          color: testResult.type === 'error' ? '#991b1b' : 
                testResult.type === 'success' ? '#166534' : 
                '#075985'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{testResult.message}</p>
          
          {testResult.instructions && (
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              {testResult.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          )}

          {testResult.error && (
            <pre style={{ 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>
              {JSON.stringify(testResult.error, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testNotifications}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#2B4936',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Again
        </button>
        {permissionState === 'denied' && (
          <button 
            onClick={resetNotificationPermission}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            How to Reset Permissions
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationTester;