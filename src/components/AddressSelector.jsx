import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { geocodeAddress, reverseGeocode } from '../utils/locationService';

export default function AddressSelector({ onAddressConfirmed }) {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState('location'); // 'location', 'address', 'confirm'
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    flat: '',
    building: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    pincode: ''
  });
  const [autocomplete, setAutocomplete] = useState(null);

  // Load Google Maps Places API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD2TeCSHqgbJIHKG0zVgGDddi4bLzNEn8o&libraries=places`;
    script.async = true;
    script.onload = initAutocomplete;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initAutocomplete = () => {
    if (window.google && document.getElementById('address-autocomplete')) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        document.getElementById('address-autocomplete'),
        {
          types: ['address'],
          componentRestrictions: { country: 'in' }
        }
      );

      autocompleteInstance.addListener('place_changed', handlePlaceSelect);
      setAutocomplete(autocompleteInstance);
    }
  };

  const handlePlaceSelect = () => {
    const place = autocomplete.getPlace();
    if (place.formatted_address) {
      setManualAddress(place.formatted_address);
      parseAddressComponents(place);
    }
  };

  const parseAddressComponents = (place) => {
    const components = place.address_components || [];
    const newDetails = { ...addressDetails };

    components.forEach(component => {
      const types = component.types;
      if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        newDetails.area = component.long_name;
      }
      if (types.includes('locality')) {
        newDetails.city = component.long_name;
      }
      if (types.includes('postal_code')) {
        newDetails.pincode = component.long_name;
      }
      if (types.includes('route')) {
        newDetails.street = component.long_name;
      }
    });

    setAddressDetails(newDetails);
  };

  const detectLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          try {
            const result = await reverseGeocode(latitude, longitude);
            if (result) {
              setDetectedAddress(result.address);
              setStep('address');
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            setStep('address');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Location detection failed:', error);
          setLoading(false);
          setStep('address');
        }
      );
    } else {
      setLoading(false);
      setStep('address');
    }
  };

  const handleAddressSubmit = async () => {
    setLoading(true);
    try {
      const fullAddress = `${addressDetails.flat} ${addressDetails.building} ${addressDetails.street} ${addressDetails.area} ${addressDetails.city} ${addressDetails.pincode}`.trim();
      
      const locationData = await geocodeAddress(fullAddress);
      
      const finalAddress = {
        ...addressDetails,
        coordinates: locationData.coordinates,
        formattedAddress: locationData.formattedAddress,
        city: locationData.city || addressDetails.city,
        pincode: locationData.pincode || addressDetails.pincode
      };

      onAddressConfirmed(finalAddress);
    } catch (error) {
      alert('Unable to find this address. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'location') {
    return (
      <div style={styles.container}>
        <div style={styles.locationCard}>
          <h2>📍 Choose Your Location</h2>
          <p>To find nearby shops and ensure accurate delivery</p>
          
          <button 
            onClick={detectLocation}
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? '🔍 Detecting...' : '📱 Use Current Location'}
          </button>
          
          <div style={styles.divider}>OR</div>
          
          <button 
            onClick={() => setStep('address')}
            style={styles.secondaryButton}
          >
            📝 Enter Address Manually
          </button>
        </div>
      </div>
    );
  }

  if (step === 'address') {
    return (
      <div style={styles.container}>
        <div style={styles.addressCard}>
          <h2>🏠 Enter Your Address</h2>
          
          {detectedAddress && (
            <div style={styles.detectedLocation}>
              <p><strong>Detected:</strong> {detectedAddress}</p>
              <button 
                onClick={() => {
                  setManualAddress(detectedAddress);
                  // Parse detected address
                }}
                style={styles.useDetectedButton}
              >
                ✓ Use This Address
              </button>
            </div>
          )}

          <div style={styles.form}>
            <div style={styles.searchBox}>
              <input
                id="address-autocomplete"
                type="text"
                placeholder="Search for your area, street name..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.addressGrid}>
              <input
                placeholder="Flat / House No *"
                value={addressDetails.flat}
                onChange={(e) => setAddressDetails({...addressDetails, flat: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="Building / Apartment Name"
                value={addressDetails.building}
                onChange={(e) => setAddressDetails({...addressDetails, building: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="Street / Road Name"
                value={addressDetails.street}
                onChange={(e) => setAddressDetails({...addressDetails, street: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="Area / Locality *"
                value={addressDetails.area}
                onChange={(e) => setAddressDetails({...addressDetails, area: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="Landmark (Optional)"
                value={addressDetails.landmark}
                onChange={(e) => setAddressDetails({...addressDetails, landmark: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="City *"
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                style={styles.input}
              />
              <input
                placeholder="Pincode *"
                value={addressDetails.pincode}
                onChange={(e) => setAddressDetails({...addressDetails, pincode: e.target.value})}
                style={styles.input}
                maxLength={6}
              />
            </div>

            <button 
              onClick={handleAddressSubmit}
              disabled={loading || !addressDetails.flat || !addressDetails.area || !addressDetails.city || !addressDetails.pincode}
              style={styles.confirmButton}
            >
              {loading ? '🔍 Confirming Location...' : '✓ Confirm Address'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px'
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%'
  },
  primaryButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '2px solid #007bff',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  divider: {
    margin: '20px 0',
    position: 'relative',
    textAlign: 'center',
    color: '#666'
  },
  detectedLocation: {
    backgroundColor: '#e8f5e8',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #28a745'
  },
  useDetectedButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  searchBox: {
    marginBottom: '10px'
  },
  searchInput: {
    width: '100%',
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none'
  },
  addressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  confirmButton: {
    padding: '15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  }
};
