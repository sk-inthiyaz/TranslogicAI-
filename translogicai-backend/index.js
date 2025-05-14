const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const db = require('./models/db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const routeHandler = require("./routes/route");
const weatherHandler = require("./routes/getweather");
const logisticsHandler = require("./routes/logistics");
const detectObjectsHandler = require("./routes/detectObjects");
const customerHandler = require('./routes/customer');
const vehicleHandler = require('./routes/vehicle');

app.use("/api/route", routeHandler);        // handles /api/route
app.use("/api/weather", weatherHandler);    // optional, for weather-only
app.use("/api/logistics", logisticsHandler); // main delivery logic
app.use("/api/detect-objects", detectObjectsHandler); // handles /api/detect-objects
app.use('/api/customer', customerHandler); // handles /api/customer
app.use('/api/vehicle', vehicleHandler); // handles /api/vehicle

// Chat endpoint if needed
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      { contents: [{ parts: [{ text: message }] }] }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply";

    res.json({ reply });
  } catch (err) {
    console.error("Gemini Chat error:", err.message);
    res.status(500).json({ error: "Failed to get reply from Gemini." });
  }
});

app.listen(5000, () =>
  console.log("✅ Server running at http://localhost:5000")
);
