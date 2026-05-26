import axios from 'axios';

const ORS_API_KEY = '5b3ce3597851110001cf6248ef2c7baf71e94700b3e926863c28708b'; // Replace with your real OpenRouteService API key

export async function getRoute(start, end) {
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  const body = {
    coordinates: [
      [start.lng, start.lat],
      [end.lng, end.lat],
    ],
  };

  const headers = {
    'Authorization': ORS_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (err) {
    console.error('Error fetching route:', err);
    return null;
  }
}
