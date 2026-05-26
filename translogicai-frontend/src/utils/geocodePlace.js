// src/utils/geocodePlace.js
import axios from 'axios';

const ORS_API_KEY = '5b3ce3597851110001cf6248ef2c7baf71e94700b3e926863c28708b'; // Replace with your OpenRouteService API key

export async function geocodePlace(place) {
  try {
    const res = await axios.get('https://api.openrouteservice.org/geocode/search', {
      params: {
        api_key: ORS_API_KEY,
        text: place,
        size: 1,
      },
    });

    const coords = res.data.features[0].geometry.coordinates;
    return { lat: coords[1], lng: coords[0] };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}
