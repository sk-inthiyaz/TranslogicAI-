import React from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/images/Home-Image-Background.png";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function CustomerHome() {
  const customer = JSON.parse(localStorage.getItem("customerData") || "{}");
  const name = customer?.fullName || customer?.name || "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <style>{`
        .hero-section { flex: 1; background-image: url(${bgImage}); background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; display: flex; align-items: center; justify-content: center; min-height: 92vh; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(30,58,138,0.5) 50%, rgba(15,23,42,0.72) 100%); }
        .hero-content { position: relative; z-index: 2; text-align: center; padding: 36px 20px; max-width: 720px; width: 100%; }
        .hero-badge { display: inline-block; background: rgba(59,130,246,0.2); border: 1px solid rgba(96,165,250,0.35); border-radius: 40px; padding: 6px 22px; margin-bottom: 24px; font-size: 12px; font-weight: 700; color: #93c5fd; letter-spacing: 2px; text-transform: uppercase; backdrop-filter: blur(8px); }
        .hero-title { font-size: clamp(1.8rem, 5vw, 3.2rem); font-weight: 900; color: #fff; line-height: 1.15; margin: 0 0 18px 0; font-family: 'Inter', sans-serif; }
        .hero-gradient { background: linear-gradient(135deg, #60a5fa, #a78bfa, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { font-size: 16px; color: #cbd5e1; margin: 0 auto 36px; line-height: 1.7; max-width: 540px; font-family: 'Inter', sans-serif; }
        .hero-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .hero-primary-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 35px rgba(59,130,246,0.45); display: inline-flex; align-items: center; gap: 8px; border: none; }
        .hero-secondary-btn { background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); color: #fff; text-decoration: none; padding: 15px 32px; border-radius: 14px; font-weight: 700; font-size: 15px; border: 1.5px solid rgba(255,255,255,0.2); display: inline-flex; align-items: center; gap: 8px; }
        .hero-stats { display: flex; gap: 16px; justify-content: center; margin-top: 48px; flex-wrap: wrap; }
        .hero-stat { text-align: center; background: rgba(255,255,255,0.06); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 20px; min-width: 90px; flex: 1; max-width: 140px; }
        .hero-stat-icon { font-size: 22px; margin-bottom: 4px; }
        .hero-stat-value { font-size: 20px; font-weight: 900; color: #fff; }
        .hero-stat-label { font-size: 10px; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }
        @media (max-width: 480px) {
          .hero-section { min-height: 100vh; min-height: 100dvh; }
          .hero-content { padding: 24px 16px; }
          .hero-badge { font-size: 10px; padding: 5px 16px; margin-bottom: 16px; letter-spacing: 1.5px; }
          .hero-title { font-size: clamp(1.5rem, 7vw, 2.4rem); margin-bottom: 14px; }
          .hero-subtitle { font-size: 14px; margin-bottom: 28px; }
          .hero-buttons { flex-direction: column; align-items: center; gap: 10px; }
          .hero-primary-btn, .hero-secondary-btn { width: 100%; justify-content: center; padding: 14px 20px; font-size: 15px; box-sizing: border-box; }
          .hero-stats { gap: 8px; margin-top: 32px; }
          .hero-stat { padding: 10px 12px; min-width: 70px; }
          .hero-stat-icon { font-size: 18px; }
          .hero-stat-value { font-size: 16px; }
          .hero-stat-label { font-size: 9px; }
        }
      `}</style>

      <div className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">🚚 Intelligent Transport Solutions</div>
          <h1 className="hero-title">
            Hey {name}! 👋<br />
            <span className="hero-gradient">Ship Smarter, Not Harder.</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered logistics at your fingertips — get instant quotes,
            real-time tracking, and the best rates across India.
          </p>
          <div className="hero-buttons">
            <Link to="/book" className="hero-primary-btn">🚚 Book a Truck</Link>
            <Link to="/track" className="hero-secondary-btn">📍 Track Shipment</Link>
          </div>
          <div className="hero-stats">
            {[
              { value: "500+", label: "Trucks", icon: "🚛" },
              { value: "50K+", label: "Deliveries", icon: "📦" },
              { value: "200+", label: "Cities", icon: "🏙️" },
              { value: "4.8★", label: "Rating", icon: "⭐" },
            ].map((s, i) => (
              <div key={i} className="hero-stat">
                <div className="hero-stat-icon">{s.icon}</div>
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
