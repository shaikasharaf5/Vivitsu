/**
 * Geocoding Utilities
 * 
 * CONFIGURATION:
 * Choose one of the following APIs and add your API key to .env:
 * 
 * 1. NOMINATIM (OpenStreetMap) - FREE, No API key needed
 *    - No setup required, just use it!
 *    - Rate limit: 1 request/second
 * 
 * 2. LOCATIONIQ - FREE tier: 5,000 requests/day
 *    - Get API key at: https://locationiq.com/
 *    - Add to .env: VITE_LOCATIONIQ_API_KEY=your_api_key
 * 
 * 3. MAPBOX - FREE tier: 100,000 requests/month
 *    - Get API key at: https://www.mapbox.com/
 *    - Add to .env: VITE_MAPBOX_API_KEY=your_api_key
 */

// Configuration - Choose your provider
const GEOCODING_PROVIDER = import.meta.env.VITE_GEOCODING_PROVIDER || 'nominatim'; // 'nominatim', 'locationiq', or 'mapbox'
const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || '';
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || '';

/**
 * Get current user location using browser's Geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Reverse Geocoding - Convert coordinates to address
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object>} Address object
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    let url, response;

    switch (GEOCODING_PROVIDER) {
      case 'locationiq':
        if (!LOCATIONIQ_API_KEY) {
          throw new Error('LocationIQ API key not configured');
        }
        url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Reverse geocoding failed');
        const locationiqData = await response.json();
        return formatLocationIQAddress(locationiqData);

      case 'mapbox':
        if (!MAPBOX_API_KEY) {
          throw new Error('Mapbox API key not configured');
        }
        url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Reverse geocoding failed');
        const mapboxData = await response.json();
        return formatMapboxAddress(mapboxData.features[0]);

      case 'nominatim':
      default:
        // Nominatim (OpenStreetMap) - Free, no API key
        url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        response = await fetch(url, {
          headers: {
            'User-Agent': 'FixMyCity-App' // Required by Nominatim
          }
        });
        if (!response.ok) throw new Error('Reverse geocoding failed');
        const nominatimData = await response.json();
        return formatNominatimAddress(nominatimData);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Forward Geocoding - Convert address to coordinates
 * @param {string} address - Address string
 * @returns {Promise<Array>} Array of location results with coordinates
 */
export const forwardGeocode = async (address) => {
  try {
    let url, response;

    switch (GEOCODING_PROVIDER) {
      case 'locationiq':
        if (!LOCATIONIQ_API_KEY) {
          throw new Error('LocationIQ API key not configured');
        }
        url = `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=5`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Forward geocoding failed');
        const locationiqData = await response.json();
        return locationiqData.map(result => ({
          displayName: result.display_name,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: formatLocationIQAddress(result)
        }));

      case 'mapbox':
        if (!MAPBOX_API_KEY) {
          throw new Error('Mapbox API key not configured');
        }
        url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_API_KEY}&limit=5`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Forward geocoding failed');
        const mapboxData = await response.json();
        return mapboxData.features.map(feature => ({
          displayName: feature.place_name,
          latitude: feature.center[1],
          longitude: feature.center[0],
          address: formatMapboxAddress(feature)
        }));

      case 'nominatim':
      default:
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=5`;
        response = await fetch(url, {
          headers: {
            'User-Agent': 'FixMyCity-App'
          }
        });
        if (!response.ok) throw new Error('Forward geocoding failed');
        const nominatimData = await response.json();
        return nominatimData.map(result => ({
          displayName: result.display_name,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: formatNominatimAddress(result)
        }));
    }
  } catch (error) {
    console.error('Forward geocoding error:', error);
    throw error;
  }
};

/**
 * Autocomplete address search with suggestions
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of address suggestions
 */
export const autocompleteAddress = async (query) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    let url, response;

    switch (GEOCODING_PROVIDER) {
      case 'locationiq':
        if (!LOCATIONIQ_API_KEY) {
          throw new Error('LocationIQ API key not configured');
        }
        url = `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&limit=5&dedupe=1`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Autocomplete failed');
        const locationiqData = await response.json();
        return locationiqData.map(result => ({
          displayName: result.display_name,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        }));

      case 'mapbox':
        if (!MAPBOX_API_KEY) {
          throw new Error('Mapbox API key not configured');
        }
        url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_API_KEY}&autocomplete=true&limit=5`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Autocomplete failed');
        const mapboxData = await response.json();
        return mapboxData.features.map(feature => ({
          displayName: feature.place_name,
          latitude: feature.center[1],
          longitude: feature.center[0]
        }));

      case 'nominatim':
      default:
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
        response = await fetch(url, {
          headers: {
            'User-Agent': 'FixMyCity-App'
          }
        });
        if (!response.ok) throw new Error('Autocomplete failed');
        const nominatimData = await response.json();
        return nominatimData.map(result => ({
          displayName: result.display_name,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        }));
    }
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

// Helper functions to format addresses from different providers

function formatNominatimAddress(data) {
  const addr = data.address || {};
  return {
    formattedAddress: data.display_name,
    street: addr.road || addr.street || '',
    city: addr.city || addr.town || addr.village || '',
    state: addr.state || '',
    country: addr.country || '',
    postalCode: addr.postcode || '',
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lon)
  };
}

function formatLocationIQAddress(data) {
  const addr = data.address || {};
  return {
    formattedAddress: data.display_name,
    street: addr.road || addr.street || '',
    city: addr.city || addr.town || addr.village || '',
    state: addr.state || '',
    country: addr.country || '',
    postalCode: addr.postcode || '',
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lon)
  };
}

function formatMapboxAddress(feature) {
  const placeName = feature.place_name;
  const context = feature.context || [];
  
  return {
    formattedAddress: placeName,
    street: feature.text || '',
    city: context.find(c => c.id.startsWith('place'))?.text || '',
    state: context.find(c => c.id.startsWith('region'))?.text || '',
    country: context.find(c => c.id.startsWith('country'))?.text || '',
    postalCode: context.find(c => c.id.startsWith('postcode'))?.text || '',
    latitude: feature.center[1],
    longitude: feature.center[0]
  };
}
