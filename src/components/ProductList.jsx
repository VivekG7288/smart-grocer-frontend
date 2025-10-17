import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProductList() {
  const { shopId } = useParams();
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    loadShop();
    loadProducts();
  }, [shopId]);

  const loadShop = async () => {
    try {
      const res = await api.get(`/shops`);
      const currentShop = res.data.find(s => s._id === shopId);
      setShop(currentShop);
    } catch (err) {
      console.error('Error loading shop:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      const shopProducts = res.data.filter(p => p.shopId === shopId);
      setProducts(shopProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  return (
    <div style={styles.container}>
      {shop && (
        <div style={styles.shopHeader}>
          <h3>{shop.name}</h3>
          <p>{shop.address} | {shop.phone}</p>
        </div>
      )}

      <h4>Available Products ({products.length})</h4>
      
      {products.length === 0 ? (
        <p>No products available in this shop yet.</p>
      ) : (
        <div style={styles.productGrid}>
          {products.map(product => (
            <div key={product._id} style={styles.productCard}>
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  style={styles.productImage}
                />
              )}
              <div style={styles.productInfo}>
                <h5>{product.name}</h5>
                <p style={styles.category}>{product.category}</p>
                <p style={styles.price}>${product.price} per {product.unit}</p>
                <p style={styles.stock}>
                  Stock: {product.stock} {product.unit}
                </p>
                <button 
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  style={product.stock === 0 ? styles.disabledButton : styles.addButton}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
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
    padding: '20px'
  },
  shopHeader: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  productCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  productInfo: {
    padding: '15px'
  },
  category: {
    color: '#666',
    fontSize: '14px',
    margin: '5px 0'
  },
  price: {
    fontWeight: 'bold',
    color: '#007bff',
    fontSize: '16px'
  },
  stock: {
    color: '#28a745',
    fontSize: '14px'
  },
  addButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  disabledButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed'
  }
};
