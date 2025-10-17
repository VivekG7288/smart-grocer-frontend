import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD2TeCSHqgbJIHKG0zVgGDddi4bLzNEn8o';

export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY,
        region: 'in' // Bias towards India
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      // Extract address components
      const addressComponents = result.address_components;
      let city = '';
      let state = '';
      let pincode = '';
      let area = '';
      
      addressComponents.forEach(component => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('sublocality_level_1')) {
          area = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          pincode = component.long_name;
        }
      });

      return {
        coordinates: [location.lng, location.lat],
        formattedAddress: result.formatted_address,
        city: city,
        state: state,
        pincode: pincode,
        area: area
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to find address location');
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        address: result.formatted_address,
        placeId: result.place_id
      };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return null;
};
