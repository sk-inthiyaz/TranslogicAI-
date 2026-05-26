import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import API_BASE from "../config/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      const isMobile = window.innerWidth <= 768;
      map.fitBounds(bounds, {
        padding: isMobile ? [30, 30] : [60, 60],
        maxZoom: 13,
        animate: true,
        duration: 0.5,
      });
    }
  }, [coords, map]);
  return null;
}

// Fix Leaflet rendering when container resizes (mobile toggle)
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    // Initial invalidate
    const timer = setTimeout(() => map.invalidateSize(), 200);
    // Watch for container resize (handles mobile toggle from hidden to visible)
    const container = map.getContainer();
    let observer;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
    }
    // Fallback: periodic check for older browsers
    const interval = setInterval(() => map.invalidateSize(), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

function getSuggestedVehicle(weight) {
  const kg = parseInt(weight);
  if (kg <= 500) return "Mini Van";
  if (kg <= 3000) return "Pickup Truck";
  if (kg <= 7000) return "Light Commercial Vehicle (LCV)";
  if (kg <= 15000) return "Full Truckload (FTL)";
  return "Heavy Truck";
}

function MapView({ start, end, weight, urgency = "Medium", onRouteUpdate, chatPrice = null }) {
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [weather, setWeather] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!start?.name || !end?.name) {
        console.warn("Missing start or end data.");
        return;
      }
      try {
        // 1. Get route geometry and summary
        const routeRes = await axios.post(`${API_BASE}/api/route`, {
          pickup: start.name,
          drop: end.name,
        });
        const { geometry, summary } = routeRes.data;
        const coords = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distKm = parseFloat(summary.distance_km);
        const etaMin = parseFloat(summary.duration_min);
        setRoute(coords);
        setDistance(distKm);
        setDuration(etaMin);
        const vehicleType = getSuggestedVehicle(weight);
        setVehicle(vehicleType);

        // 2. Get weather (handle error gracefully)
        let weatherData = null;
        try {
          const weatherRes = await axios.post(`${API_BASE}/api/weather`, {
            lat: start.lat,
            lon: start.lng,
          });
          weatherData = weatherRes.data;
        } catch (err) {
          weatherData = { description: "N/A", temp: "-", humidity: "-" };
        }
        setWeather(weatherData);

        // 3. Get price (handle error gracefully)
        let priceData = null;
        try {
          // Get cargo from Gemini AI (if available)
          let cargo = vehicle || 'General Goods';
          if (!cargo || cargo.trim() === '') cargo = 'General Goods';
          // Try to get from localStorage (customerData)
          let customerName = 'Guest';
          let customerPhone = '0000000000';
          const customerData = JSON.parse(localStorage.getItem('customerData'));
          if (customerData) {
            customerName = customerData.fullName || customerData.name || 'Guest';
            customerPhone = customerData.phone || '0000000000';
          }
          if (!customerName || customerName.trim() === '') customerName = 'Guest';
          if (!customerPhone || customerPhone.trim() === '') customerPhone = '0000000000';
          const pricingRes = await axios.post(`${API_BASE}/api/logistics`, {
            pickup: start.name,
            drop: end.name,
            weight,
            urgency,
            distanceKm: distKm,
            cargo,
            customerName,
            customerPhone,
          });
          priceData = pricingRes.data.price;
        } catch (err) {
          priceData = null;
        }
        setPrice(priceData);

        // 4. Call onRouteUpdate if needed
        if (onRouteUpdate) {
          onRouteUpdate({
            start,
            end,
            weight,
            routeData: coords,
            summary: {
              price: priceData,
              carbon: (distKm * 0.21).toFixed(2),
              eta: etaMin.toFixed(0),
              vehicle: vehicleType,
            },
          });
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error.message || error);
        setRoute([]);
        setDistance(null);
        setDuration(null);
        setWeather(null);
        setPrice(null);
      }
    };
    fetchRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, weight, urgency, onRouteUpdate]);

  return (
    <>
      <style>{`
        .mv-outer { display: flex; flex-direction: column; height: 100%; width: 100%; background: #fff; }
        .mv-map-area { flex: 1; position: relative; min-height: 300px; }
        .mv-summary { padding: 16px 18px; font-size: 13px; color: #1e293b; font-family: 'Inter', sans-serif; background: #fff; border-top: 1px solid #e2e8f0; }
        .mv-summary-title { font-weight: 800; font-size: 15px; color: #1d4ed8; margin: 0 0 10px 0; }
        .mv-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
        .mv-summary-grid p { margin: 0; padding: 4px 0; }
        .mv-desktop-only { display: none; }
        .mv-mobile-only { display: block; }
        @media (min-width: 769px) {
          .mv-desktop-only { display: block; position: absolute; top: 16px; right: 16px; z-index: 999; width: 240px; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); border-top: none; }
          .mv-mobile-only { display: none; }
          .mv-map-area { position: relative; }
        }
        @media (max-width: 768px) {
          .mv-summary { padding: 14px 16px; font-size: 12px; }
          .mv-summary-title { font-size: 14px; margin-bottom: 8px; }
        }
      `}</style>
      <div className="mv-outer">
        <div className="mv-map-area">
          <MapContainer
            center={[start?.lat || 20, start?.lng || 78]}
            zoom={5}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <InvalidateSize />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {start && (
              <Marker position={[start.lat, start.lng]}>
                <Popup>📦 Pickup Point</Popup>
              </Marker>
            )}
            {end && (
              <Marker position={[end.lat, end.lng]}>
                <Popup>🏁 Drop Point</Popup>
              </Marker>
            )}
            {route.length > 0 && (
              <>
                <Polyline positions={route} pathOptions={{ color: "#dc2626", weight: 6, opacity: 0.85 }} />
                <FitBounds coords={route} />
              </>
            )}
          </MapContainer>
          {/* Desktop overlay summary */}
          {distance && duration && (
            <div className="mv-summary mv-desktop-only">
              <h2 className="mv-summary-title">📊 Delivery Summary</h2>
              <div className="mv-summary-grid">
                <p>📏 <strong>Distance:</strong> {distance.toFixed(1)} km</p>
                <p>⏱ <strong>ETA:</strong> {duration.toFixed(0)} mins</p>
                <p>💰 <strong>Price:</strong> {(price ?? chatPrice) !== null ? `₹${(price ?? chatPrice).toLocaleString('en-IN')}` : '—'}</p>
                <p>🌱 <strong>CO₂:</strong> {(distance * 0.21).toFixed(1)} kg</p>
                <p>🚚 <strong>Vehicle:</strong> {vehicle || '—'}</p>
                <p>🌤 <strong>Weather:</strong> {weather?.description || '—'}</p>
                <p>🌡 <strong>Temp:</strong> {weather?.temp != null ? `${weather.temp}°C` : '—'}</p>
                <p>💧 <strong>Humidity:</strong> {weather?.humidity != null ? `${weather.humidity}%` : '—'}</p>
              </div>
            </div>
          )}
        </div>
        {/* Mobile summary below map */}
        {distance && duration && (
          <div className="mv-summary mv-mobile-only">
            <h2 className="mv-summary-title">📊 Delivery Summary</h2>
            <div className="mv-summary-grid">
              <p>📏 <strong>Distance:</strong> {distance.toFixed(1)} km</p>
              <p>⏱ <strong>ETA:</strong> {duration.toFixed(0)} mins</p>
              <p>💰 <strong>Price:</strong> {(price ?? chatPrice) !== null ? `₹${(price ?? chatPrice).toLocaleString('en-IN')}` : '—'}</p>
              <p>🌱 <strong>CO₂:</strong> {(distance * 0.21).toFixed(1)} kg</p>
              <p>🚚 <strong>Vehicle:</strong> {vehicle || '—'}</p>
              <p>🌤 <strong>Weather:</strong> {weather?.description || '—'}</p>
              <p>🌡 <strong>Temp:</strong> {weather?.temp != null ? `${weather.temp}°C` : '—'}</p>
              <p>💧 <strong>Humidity:</strong> {weather?.humidity != null ? `${weather.humidity}%` : '—'}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MapView;
