// 📁 routes/getweather.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

router.post("/", async (req, res) => {
    const { lat, lon } = req.body;
  
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }
  
    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
  
      const weatherData = weatherRes.data;
  
      const temp = weatherData.main?.temp;
      const humidity = weatherData.main?.humidity;
      const description = weatherData.weather?.[0]?.description;
  
      if (temp == null || humidity == null || !description) {
        return res.status(500).json({ error: "Incomplete weather data from API." });
      }
  
      res.json({ temp, humidity, description });
    } catch (error) {
      console.error("Weather API error:", error.message);
      res.status(500).json({ error: "Failed to fetch weather data." });
    }
  });
  
module.exports = router;
