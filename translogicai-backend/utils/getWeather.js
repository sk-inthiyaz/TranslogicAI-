const axios = require("axios");

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getWeather(location) {
  try {
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: location,
        format: "json",
        limit: 1,
      },
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error("Geocoding failed");
    }

    const { lat, lon } = geoRes.data[0];

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    const weather = weatherRes.data.weather?.[0]?.description || "clear";
    return weather.toLowerCase();
  } catch (err) {
    console.error("❌ Error fetching weather:", err.message);
    return "clear"; // fallback
  }
}

module.exports = getWeather;
