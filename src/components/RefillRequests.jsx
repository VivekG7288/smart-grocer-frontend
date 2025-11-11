import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { AuthContext } from '../contexts/AuthContext';

export default function RefillRequests() {
  const { user } = useContext(AuthContext);
  const [shop, setShop] = useState(null);
  const [refillRequests, setRefillRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, CONFIRMED, ALL

  useEffect(() => {
    findShopAndLoadRequests();
  }, [user]);

  const findShopAndLoadRequests = async () => {
    try {
      setLoading(true);
      
      // Find shopkeeper's shop
      const shopsRes = await api.get('/shops');
      const userShop = shopsRes.data.find(s => 
        s.ownerId === user._id || 
        s.ownerId.toString() === user._id.toString() ||
        (typeof s.ownerId === 'object' && s.ownerId._id === user._id)
      );
      
      if (userShop) {
        setShop(userShop);
        await loadRefillRequests(userShop._id);
      }
    } catch (err) {
      console.error('Error loading refill requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRefillRequests = async (shopId) => {
    try {
      const res = await api.get(`/pantry/shop/${shopId}/requests`);
      console.log('Refill requests:', res.data);
      setRefillRequests(res.data);
    } catch (err) {
      console.error('Error loading refill requests:', err);
    }
  };

  const handleRefillAction = async (requestId, action) => {
    try {
      const res = await api.put(`/pantry/request/${requestId}/confirm`, {
        status: action
      });
      
      // Update local state
      setRefillRequests(refillRequests.map(req => 
        req._id === requestId ? res.data : req
      ));
      
      const actionText = {
        'CONFIRMED': 'confirmed',
        'OUT_FOR_DELIVERY': 'marked as out for delivery',
        'DELIVERED': 'marked as delivered'
      };
      
      alert(`Request ${actionText[action]} successfully!`);
    } catch (err) {
      console.error('Error updating refill request:', err);
      alert('Error updating request: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredRequests = filter === 'ALL' 
    ? refillRequests 
    : refillRequests.filter(req => {
        if (filter === 'PENDING') {
          return req.status === 'REFILL_REQUESTED';
        }
        if (filter === 'CONFIRMED') {
          return ['CONFIRMED', 'OUT_FOR_DELIVERY'].includes(req.status);
        }
        return true;
      });

  const getStatusColor = (status) => {
    switch (status) {
      case 'REFILL_REQUESTED': return '#ffc107';
      case 'CONFIRMED': return '#17a2b8';
      case 'OUT_FOR_DELIVERY': return '#007bff';
      case 'DELIVERED': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading refill requests...</div>;
  }

  if (!shop) {
    return (
      <div style={styles.container}>
        <h3>🔔 Refill Requests</h3>
        <p>You need to create a shop first to receive refill requests.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>🔔 Refill Requests for {shop.name}</h3>
        <div style={styles.filters}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="PENDING">Pending ({refillRequests.filter(r => r.status === 'REFILL_REQUESTED').length})</option>
            <option value="CONFIRMED">Active ({refillRequests.filter(r => ['CONFIRMED', 'OUT_FOR_DELIVERY'].includes(r.status)).length})</option>
            <option value="ALL">All ({refillRequests.length})</option>
          </select>
          <button onClick={findShopAndLoadRequests} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={styles.emptyState}>
          {filter === 'PENDING' ? (
            <>
              <h4>🎉 No pending refill requests!</h4>
              <p>New requests will appear here when customers need refills.</p>
            </>
          ) : (
            <p>No {filter.toLowerCase()} requests found.</p>
          )}
        </div>
      ) : (
        <div style={styles.requestsList}>
          {filteredRequests.map(request => (
            <div key={request._id} style={styles.requestCard}>
              <div style={styles.requestHeader}>
                <div style={styles.customerInfo}>
                  <h4>👤 {request.userId?.name}</h4>
                  <p style={styles.customerEmail}>{request.userId?.email}</p>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(request.status)
                }}>
                  {request.status.replace('_', ' ')}
                </span>
              </div>

              <div style={styles.productInfo}>
                <div style={styles.productDetails}>
                  <h5>📦 {request.productName}</h5>
                  <p><strong>Brand:</strong> {request.brandName || 'Generic'}</p>
                  <p><strong>Quantity:</strong> {request.packsOwned} packs × {request.quantityPerPack} {request.unit}</p>
                  <p><strong>Price:</strong> ₹{request.price} per pack</p>
                  <p><strong>Total:</strong> ₹{(request.price * request.packsOwned).toFixed(2)}</p>
                </div>
              </div>

              <div style={styles.deliveryInfo}>
                <h5>📍 Delivery Address:</h5>
                <div style={styles.addressDetails}>
                  {request.userId?.location ? (
                    <>
                      <p>{request.userId.location.address}</p>
                      <p>{request.userId.location.city} - {request.userId.location.pincode}</p>
                    </>
                  ) : (
                    <p style={styles.noAddress}>Address not available - Contact customer</p>
                  )}
                </div>
              </div>

              <div style={styles.requestActions}>
                {request.status === 'REFILL_REQUESTED' && (
                  <div style={styles.actionButtons}>
                    <button 
                      onClick={() => handleRefillAction(request._id, 'CONFIRMED')}
                      style={styles.confirmButton}
                    >
                      ✅ Confirm & Prepare
                    </button>
                    <button 
                      onClick={() => {
                        const phone = prompt('Customer phone number for confirmation:');
                        if (phone) {
                          console.log(`Call customer at ${phone} for ${request.productName}`);
                          alert(`📞 Please call ${request.userId.name} at ${phone} to confirm delivery`);
                        }
                      }}
                      style={styles.callButton}
                    >
                      📞 Call Customer
                    </button>
                  </div>
                )}
                
                {request.status === 'CONFIRMED' && (
                  <button 
                    onClick={() => handleRefillAction(request._id, 'OUT_FOR_DELIVERY')}
                    style={styles.shipButton}
                  >
                    🚚 Mark as Out for Delivery
                  </button>
                )}
                
                {request.status === 'OUT_FOR_DELIVERY' && (
                  <button 
                    onClick={() => handleRefillAction(request._id, 'DELIVERED')}
                    style={styles.deliverButton}
                  >
                    📦 Mark as Delivered
                  </button>
                )}
              </div>

              <div style={styles.requestFooter}>
                <small>Requested: {new Date(request.updatedAt).toLocaleString('en-IN')}</small>
                {request.notes && (
                  <p style={styles.notes}><strong>Notes:</strong> {request.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#666'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #ddd'
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px'
  },
  customerInfo: {
    flex: 1
  },
  customerEmail: {
    color: '#666',
    fontSize: '14px',
    margin: '4px 0'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  productInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  productDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  deliveryInfo: {
    backgroundColor: '#e8f4f8',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  addressDetails: {
    marginTop: '8px'
  },
  noAddress: {
    color: '#dc3545',
    fontWeight: 'bold'
  },
  requestActions: {
    marginBottom: '15px'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  confirmButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  callButton: {
    padding: '10px 20px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  shipButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  deliverButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  requestFooter: {
    borderTop: '1px solid #eee',
    paddingTop: '10px',
    color: '#666',
    fontSize: '14px'
  },
  notes: {
    marginTop: '8px',
    fontStyle: 'italic'
  }
};