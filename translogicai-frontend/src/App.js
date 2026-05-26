import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import API_BASE from "./config/api";
import ChatApp from "./components/ChatApp";
import MapView from "./components/MapView";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SimpleFooter from "./components/SimpleFooter";
import UserTypeCards from "./components/UserTypeCards";
import CustomerLogin from "./components/CustomerLogin";
import DriverHome from "./components/DriverHome";
import DriverLayout from "./components/DriverLayout";
import MyVehicles from "./components/MyVehicles";
import DriverLogin from "./components/DriverLogin";
import Loads from "./components/Loads";
import Earnings from "./components/Earnings";
import Profile from "./components/Profile";
import Pricing from "./components/Pricing";
import CustomerHome from "./components/CustomerHome";
import HowItWorks from "./components/HowItWorks";
import Contact from "./components/Contact";
import DriverContact from "./components/DriverContact";
import CustomerProfile from "./components/CustomerProfile";

// ── Book Truck Page ─────────────────────────────────────────────────────────
function BookTruckPage() {
  const [mapData, setMapData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [summary, setSummary] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const prevMapDataRef = React.useRef(null);

  // Auto-switch to map on mobile when new route data arrives
  React.useEffect(() => {
    if (mapData?.start?.name && mapData?.end?.name && mapData?.weight) {
      // Only auto-switch if this is NEW data (not restored from localStorage)
      if (prevMapDataRef.current === null && mapData) {
        // First load (could be from localStorage) — don't auto-switch
        prevMapDataRef.current = mapData;
        return;
      }
      if (prevMapDataRef.current !== mapData) {
        prevMapDataRef.current = mapData;
        // Check if mobile
        if (window.innerWidth <= 768) {
          setShowMap(true);
        }
      }
    }
  }, [mapData]);

  return (
    <>
      <style>{`
        .book-page { display: flex; min-height: calc(100vh - 60px); background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%); }
        .book-chat { position: fixed; top: 64px; left: 12px; width: 420px; height: calc(100vh - 76px); background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; display: flex; flex-direction: column; z-index: 1050; box-shadow: 0 8px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .book-chat-inner { flex: 1; overflow-y: auto; }
        .book-spacer { width: 444px; flex-shrink: 0; }
        .book-map-wrap { flex: 1; margin: 12px 12px 12px 0; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; min-height: 400px; }
        .book-map-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 16px; flex-direction: column; gap: 12px; flex: 1; }
        .book-map-placeholder svg { width: 64px; height: 64px; opacity: 0.3; }
        .book-mobile-toggle { display: none; }

        @media (max-width: 768px) {
          .book-page { flex-direction: column; position: relative; }
          .book-chat { position: relative; top: 0; left: 0; width: 100%; height: calc(100vh - 60px); border-radius: 0; border: none; box-shadow: none; }
          .book-spacer { display: none; }
          .book-map-wrap { position: fixed; top: 60px; left: 0; right: 0; bottom: 0; margin: 0; border-radius: 0; border: none; z-index: 1060; min-height: unset; animation: mapSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
          .book-chat.m-hide { display: none; }
          .book-map-wrap.m-hide { display: none; }

          /* Back to Chat button */
          .book-mobile-toggle {
            display: flex; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1200; border: none; border-radius: 50px;
            padding: 14px 32px; font-weight: 800; font-size: 15px;
            cursor: pointer; gap: 8px; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif; letter-spacing: 0.3px;
            transition: all 0.2s ease;
          }
          .book-mobile-toggle.to-chat {
            background: linear-gradient(135deg, #0f172a, #1e3a8a);
            color: #fff; box-shadow: 0 8px 30px rgba(15,23,42,0.5);
          }
          .book-mobile-toggle.to-map {
            background: linear-gradient(135deg, #059669, #10b981);
            color: #fff; box-shadow: 0 8px 30px rgba(5,150,105,0.45);
          }
        }

        @keyframes mapSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="book-page">
        {/* Chat */}
        <div className={`book-chat ${showMap ? "m-hide" : ""}`}>
          <div className="book-chat-inner">
            <ChatApp onRouteUpdate={(data) => { setMapData(data); }} />
          </div>
        </div>
        <div className="book-spacer" />
        {/* Map — full screen on mobile, fills right side on desktop */}
        <div className={`book-map-wrap ${!showMap ? "m-hide" : ""}`}>
          {mapData?.start?.name && mapData?.end?.name && mapData?.weight ? (
            <MapView
              start={mapData.start}
              end={mapData.end}
              weight={mapData.weight}
              chatPrice={mapData?.summary?.price ?? null}
              onRouteUpdate={setSummary}
            />
          ) : (
            <div className="book-map-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Enter pickup & drop to see the route map</span>
            </div>
          )}
        </div>
        {/* Mobile floating toggle */}
        {showMap ? (
          <button className="book-mobile-toggle to-chat" onClick={() => setShowMap(false)}>
            💬 Back to Chat
          </button>
        ) : (
          mapData?.start?.name && (
            <button className="book-mobile-toggle to-map" onClick={() => setShowMap(true)}>
              🗺️ View Route Map
            </button>
          )
        )}
      </div>
    </>
  );
}

// ── Simple placeholder page ──────────────────────────────────────────────────
function PlaceholderPage({ title }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ color: "#64748b", fontSize: 22 }}>{title} — Coming Soon</h2>
      </div>
      <Footer />
    </div>
  );
}

// ── Track Shipment Page ──────────────────────────────────────────────────────
function TrackPage() {
  const [load, setLoad] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("activeLoad") || "null"); } catch { return null; }
  });
  const [loadId] = React.useState(() => localStorage.getItem("bookedLoadId") || "");
  // eslint-disable-next-line no-unused-vars
  const [polling, setPolling] = React.useState(false);

  React.useEffect(() => {
    if (!loadId) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/logistics/load/${loadId}`);
        if (res.ok) {
          const data = await res.json();
          setLoad(data);
          localStorage.setItem("activeLoad", JSON.stringify(data));
        }
      } catch { /* silent */ }
    };
    poll();
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, [loadId]);

  const statusStyle = {
    Pending:     { bg: "#fef9c3", color: "#854d0e", label: "⏳ Waiting for driver..." },
    Assigned:    { bg: "#dbeafe", color: "#1e40af", label: "✅ Driver Assigned" },
    "In Transit":{ bg: "#fef3c7", color: "#92400e", label: "🚛 In Transit" },
    Delivered:   { bg: "#dcfce7", color: "#166534", label: "🎉 Delivered!" },
    Cancelled:   { bg: "#fee2e2", color: "#991b1b", label: "❌ Cancelled" },
  };
  const ss = statusStyle[load?.status] || statusStyle.Pending;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ flex: 1, background: "#f8fafc", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>📍 Track Your Shipment</h1>

        {!load && !loadId ? (
          <div style={{ textAlign: "center", marginTop: 60, color: "#94a3b8" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 16 }}>No active booking found. <a href="/book" style={{ color: "#1d4ed8", fontWeight: 700 }}>Book a truck</a> to get started.</p>
          </div>
        ) : load ? (
          <div style={{ maxWidth: 520, width: "100%", marginTop: 20 }}>
            {/* Status Banner */}
            <div style={{
              background: ss.bg, color: ss.color,
              borderRadius: 14, padding: "16px 20px", textAlign: "center",
              fontWeight: 800, fontSize: 16, marginBottom: 20,
              border: `1.5px solid ${ss.color}33`,
            }}>
              {ss.label}
            </div>

            {/* Load Card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0", marginBottom: 16,
            }}>
              {[
                ["📍 Pickup",    load.pickup],
                ["🏁 Drop",      load.drop],
                ["⚖️ Weight",    `${load.weight} kg`],
                ["💰 Price",     `₹${load.price?.toLocaleString("en-IN") || "—"}`],
                ["🚨 Urgency",   load.urgency],
                ["📏 Distance",  load.distanceKm ? `${load.distanceKm.toFixed(1)} km` : "—"],
                ["📅 Booked",    new Date(load.createdAt).toLocaleString("en-IN")],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14,
                }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "#0f172a", fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Driver Card */}
            {load.driver && (
              <div style={{
                background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                border: "1.5px solid #93c5fd", borderRadius: 16,
                padding: 20, marginBottom: 16,
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e40af", marginBottom: 12 }}>🚛 Your Driver</div>
                {[
                  ["👤 Name",     load.driver.name],
                  ["📞 Phone",    load.driver.phone],
                  ["📍 Location", load.driver.location || "En route"],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: "#3b82f6", fontWeight: 600 }}>{label}</span>
                    <span style={{ color: "#1e3a8a", fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
                <a href={`tel:${load.driver.phone}`} style={{
                  display: "block", marginTop: 12, padding: "10px",
                  background: "#1d4ed8", color: "#fff", borderRadius: 10,
                  textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 14,
                }}>
                  📞 Call Driver
                </a>
              </div>
            )}

            {!load.driver && (
              <div style={{
                background: "#fffbeb", border: "1.5px solid #fcd34d",
                borderRadius: 14, padding: 16, textAlign: "center",
                color: "#92400e", fontSize: 14, fontWeight: 600,
              }}>
                ⏳ Waiting for a nearby driver to accept your load...<br />
                <span style={{ fontSize: 12, fontWeight: 400, marginTop: 4, display: "block" }}>
                  This page refreshes automatically every 10 seconds.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: 40, color: "#94a3b8" }}>
            <div style={{ fontSize: 36 }}>⏳</div>
            <p>Loading your shipment details...</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}


// ── App with all routes ──────────────────────────────────────────────────────
function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Entry / Auth */}
        <Route path="/entry"          element={<UserTypeCards />} />
        <Route path="/login-customer" element={<CustomerLogin />} />
        <Route path="/login-driver"   element={<DriverLogin />} />

        {/* Driver routes */}
        <Route path="/driver/*" element={
          <DriverLayout>
            <Routes>
              <Route path="home"     element={<DriverHome />} />
              <Route path="vehicles" element={<MyVehicles />} />
              <Route path="loads"    element={<Loads />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="profile"  element={<Profile />} />
              <Route path="contact"  element={<DriverContact />} />
            </Routes>
          </DriverLayout>
        } />

        {/* Customer routes — all under /customer/* */}
        <Route path="/customer/home"     element={<CustomerHome />} />
        <Route path="/customer/profile"  element={<CustomerProfile />} />
        <Route path="/customer/bookings" element={<CustomerProfile />} />
        <Route path="/customer/settings" element={<PlaceholderPage title="Settings" />} />

        {/* Shared public routes */}
        <Route path="/book"        element={<><Navbar /><BookTruckPage /><SimpleFooter /></>} />
        <Route path="/track"       element={<TrackPage />} />
        <Route path="/pricing"     element={<><Navbar /><Pricing /><Footer /></>} />
        <Route path="/how-it-works" element={<><Navbar /><HowItWorks /><Footer /></>} />
        <Route path="/contact"      element={<><Navbar /><Contact /><Footer /></>} />
        <Route path="/profile"     element={<PlaceholderPage title="Profile" />} />

        {/* Root redirect → customer home */}
        <Route path="/" element={<Navigate to="/customer/home" replace />} />
      </Routes>
    </div>
  );
}

export default App;
