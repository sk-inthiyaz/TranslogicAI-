# 🚛 TransLogic AI — AI-Powered Freight Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</p>

> A full-stack logistics platform that connects customers who need trucks with verified nearby drivers — powered by AI-driven pricing, real-time route calculation, and vehicle-level proximity matching.

---

## 🌟 What is TransLogic AI?

**TransLogic AI** is a MERN stack truck-booking and freight management platform built for India's logistics market.

- **Customers** chat with **Logix** (AI assistant) to get instant freight quotes, negotiate prices, confirm bookings, and track shipments live.
- **Drivers/Owners** manage their fleet, set vehicle locations, and receive load notifications only within **50 km** of their truck — no wasted trips.
- **Admins** verify vehicle documents, activate trucks, and monitor platform activity through a dedicated dashboard.

---

## 🎯 Core Features

### For Customers
- 🤖 **AI Chat Booking** — Natural language conversation with Logix (Gemini 2.0 Flash) to enter pickup, drop, weight & urgency
- 💰 **Instant Price Quote** — Calculated using distance, weight, urgency level, and live weather conditions
- 🔄 **Price Negotiation** — 3-round AI negotiation engine; accepts or counter-offers intelligently
- 🗺️ **Live Route Map** — Leaflet.js map with route polyline, ETA, distance, and vehicle suggestion
- 📍 **Shipment Tracking** — Real-time status polling (Pending → Assigned → In Transit → Delivered)
- 📞 **Direct Driver Contact** — One-tap call button once driver is assigned

### For Drivers
- 🚛 **Fleet Management** — Add multiple vehicles with full document upload (RC, permit, insurance, PUC, etc.)
- 📍 **Per-Vehicle Location** — Set city location per truck; coordinates resolved from a 60+ city lookup table
- 🎯 **50 km Proximity Filter** — Only see loads near your vehicle using the Haversine formula
- 🔀 **Vehicle Picker** — If 2+ trucks are near a pickup, choose which one to dispatch
- ✅ **Accept / Reject Loads** — Rejected loads never appear again for that driver
- 💼 **Earnings History** — Track all accepted loads and revenue

### For Admins
- 📋 **Vehicle Verification** — Review uploaded documents, activate or reject trucks
- 🔍 **Searchable Dashboard** — Filter vehicles by name, number, or status
- 📊 **Platform Overview** — Monitor all drivers, vehicles, and loads

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js 18, React Router v6, Leaflet.js, Axios, Tailwind CSS |
| **Backend** | Node.js, Express.js, Multer (file uploads) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **AI** | Google Gemini 2.0 Flash API |
| **Maps & Routing** | OpenRouteService (geocoding + directions), Leaflet + OpenStreetMap |
| **Weather** | OpenWeatherMap API |
| **Admin Dashboard** | Vanilla HTML + CSS + JavaScript |
| **Deployment** | Vercel (frontend preview), MongoDB Atlas (cloud DB) |

---

## 🧠 Key Algorithms

### Pricing Formula
```
Price = (₹8 × distance_km) + (weight_rate × weight_kg) × urgency_factor × weather_factor

Weight rate : ₹0.30/kg (≤ 5000 kg)  |  ₹0.50/kg (> 5000 kg)
Urgency     : Low × 1.0  |  Medium × 1.2  |  High × 1.5
Weather     : Rain/Storm × 1.1  |  Clear × 1.0
```

### Haversine Proximity Engine
Each driver's activated vehicles have city coordinates stored. When a load is created, its pickup coordinates are stored. The backend calculates real-world distance using the Haversine formula — loads beyond **50 km** are filtered out completely.

---

## 📁 Project Structure

```
TranslogicAI/
├── translogicai-frontend/     # React SPA
│   └── src/
│       ├── components/        # ChatApp, MapView, Loads, MyVehicles, etc.
│       ├── utils/             # geocodePlace, calculatePrice
│       └── App.js             # All routes defined here
│
├── translogicai-backend/      # Node + Express REST API
│   ├── models/                # Driver, Vehicle, Load, Customer schemas
│   ├── routes/                # driver, vehicle, customer, logistics, weather
│   └── utils/                 # calculatePrice, getWeather
│
└── Dashboard/                 # Admin panel (plain HTML/JS)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI
- API Keys: Gemini, OpenRouteService, OpenWeatherMap

### Backend Setup
```bash
cd translogicai-backend
npm install
# Create .env with:
# MONGODB_URI=...
# GEMINI_API_KEY=...
# Directions_API_KEY=...
# OPENWEATHER_API_KEY=...
node index.js
```

### Frontend Setup
```bash
cd translogicai-frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Admin Dashboard
Open `Dashboard/index.html` directly in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/logistics/` | Get AI-powered freight quote |
| POST | `/api/logistics/book` | Confirm booking → create Load |
| GET | `/api/logistics/load/:id` | Poll load status (customer tracking) |
| POST | `/api/driver/signup` | Driver registration |
| GET | `/api/driver/pending-loads` | Proximity-filtered loads for driver |
| POST | `/api/driver/accept-load` | Accept load with vehicle selection |
| POST | `/api/vehicle/add` | Add vehicle with document upload |
| POST | `/api/vehicle/:id/location` | Update per-vehicle city coordinates |
| POST | `/api/customer/login` | Customer authentication |
| POST | `/api/chat` | Raw Gemini AI chat |

---

## 👥 Three-Actor Architecture

```
CUSTOMER  ──→  books load via AI chat  ──→  Load created (Pending)
                                                    ↓
DRIVER    ←──  sees load within 50 km  ←──  Proximity engine filters
         ──→  accepts load + picks vehicle  ──→  Load (Assigned)
                                                    ↓
CUSTOMER  ←──  polls /track every 10s  ←──  Sees driver name + phone
```

---

## 📄 License

MIT License — built for learning and demonstration purposes.

---

<p align="center">Built with ❤️ by <a href="https://github.com/sk-inthiyaz">SK Inthiyaz</a></p>