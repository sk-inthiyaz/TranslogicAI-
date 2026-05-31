const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const mongoose = require('mongoose');


// Pre-register all Mongoose models before any route loads them
require('./models/db');

const app = express();
// Global request logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Configure CORS — in production, set FRONTEND_URL env var
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['*'];
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const routeHandler = require("./routes/route");
const weatherHandler = require("./routes/getweather");
const logisticsHandler = require("./routes/logistics");
const detectObjectsHandler = require("./routes/detectObjects");
const customerHandler = require('./routes/customer');
const vehicleHandler = require('./routes/vehicle');
const driverHandler = require('./routes/driver');
const adminHandler = require('./routes/admin');

app.use("/api/route", routeHandler);        // handles /api/route
app.use("/api/weather", weatherHandler);    // optional, for weather-only
app.use("/api/logistics", logisticsHandler); // main delivery logic
app.use("/api/detect-objects", detectObjectsHandler); // handles /api/detect-objects
app.use('/api/customer', customerHandler); // handles /api/customer

app.use('/api/vehicle', vehicleHandler); // handles /api/vehicle
app.use('/vehicle', vehicleHandler);     // backwards compat for dashboard
app.use('/list', vehicleHandler);        // backwards compat for /list/all

app.use('/api/driver', driverHandler); // handles /api/driver
app.use('/api/admin', adminHandler);   // handles /api/admin (admin login/verify)

const contactHandler = require('./routes/contact');
app.use('/api/contact', contactHandler); // handles /api/contact (contact form messages)

// ── Logix AI Conversational Endpoint ──────────────────────────────────────────
const LOGIX_SYSTEM_PROMPT = `You are Logix, a friendly and warm logistics booking assistant for TransLogic AI — an Indian truck logistics platform.

PERSONALITY:
- You talk like a real, warm human — not a corporate robot. Think of yourself as a helpful friend who works in logistics.
- You're casual but professional. You genuinely care about helping the customer.
- You use emojis sparingly — 1 or 2 per message MAX, and only when they feel natural. NOT every sentence.
- You NEVER repeat the same phrasing twice. Every response must feel fresh and unique.
- Keep responses SHORT — 2-4 sentences maximum. Never write paragraphs.
- You occasionally use light humor or warmth ("No worries!", "You got it!", "Let's make this happen!")
- You understand Indian cities, Hindi words mixed into English is fine (but respond mainly in English).
- NEVER say "I'm an AI" or "As an AI assistant" — you are Logix, a logistics expert.

RESPONSE RULES:
- When given specific data (price, distance, city names, weight), ALWAYS include those exact numbers/names naturally in your response.
- When mentioning a price, ALWAYS use the ₹ symbol and the EXACT number provided — never round or change it.
- When mentioning distance, use the EXACT number provided in km.
- Do NOT add any data that wasn't provided to you.
- Do NOT invent prices, distances, or details.
- NEVER use markdown formatting like **bold** or *italic* or bullet points. Write plain conversational text with emojis only.
- Respond ONLY with the message text. No labels, no "Logix:", no prefixes.`;

app.post("/api/chat/respond", async (req, res) => {
  const { situation, context, history, fallback } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!situation) {
    return res.status(400).json({ error: "situation is required" });
  }

  try {
    // Build conversation context for Gemini
    let contextBlock = "";
    if (context) {
      const parts = [];
      if (context.pickup) parts.push(`Pickup: ${context.pickup}`);
      if (context.drop) parts.push(`Drop: ${context.drop}`);
      if (context.weight) parts.push(`Weight: ${context.weight}kg`);
      if (context.urgency) parts.push(`Urgency: ${context.urgency}`);
      if (context.distance) parts.push(`Distance: ${context.distance}km`);
      if (context.price) parts.push(`Price: ₹${context.price}`);
      if (context.minPrice) parts.push(`Minimum acceptable price: ₹${context.minPrice}`);
      if (context.offer) parts.push(`Customer's offer: ₹${context.offer}`);
      if (context.counterOffer) parts.push(`Your counter-offer: ₹${context.counterOffer}`);
      if (context.detectedLabel) parts.push(`Detected goods: ${context.detectedLabel}`);
      if (context.driverName) parts.push(`Driver name: ${context.driverName}`);
      if (context.driverPhone) parts.push(`Driver phone: ${context.driverPhone}`);
      if (parts.length > 0) contextBlock = `\n\nCURRENT BOOKING DATA:\n${parts.join("\n")}`;
    }

    // Build recent chat history
    let historyBlock = "";
    if (history && history.length > 0) {
      const recent = history.slice(-6);
      historyBlock = "\n\nRECENT CONVERSATION:\n" + recent.map(m =>
        `${m.sender === "user" ? "Customer" : "Logix"}: ${m.text}`
      ).join("\n");
    }

    const userPrompt = `SITUATION: ${situation}${contextBlock}${historyBlock}\n\nRespond as Logix in 2-4 sentences. Be natural and human. Include the exact data provided.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          { role: "user", parts: [{ text: LOGIX_SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Understood! I'm Logix, ready to help customers with their shipments in a warm, natural way." }] },
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      }
    );

    let reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply || reply.trim().length === 0) {
      return res.json({ reply: fallback || "Let me help you with that!", usedFallback: true });
    }

    // Clean up: remove any "Logix:" prefix the model might add
    reply = reply.replace(/^(Logix|Bot|Assistant)\s*:\s*/i, "").trim();

    res.json({ reply, usedFallback: false });
  } catch (err) {
    console.error("Logix AI error:", err.message);
    // Return fallback message so frontend never breaks
    res.json({ reply: fallback || "Let me help you with that!", usedFallback: true });
  }
});

// ✅ Only start the server AFTER MongoDB is connected
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});
