import React, { useState, useEffect } from "react";
import API_BASE from "../config/api";
import bgImage from "../assets/images/Home-Image-Background.png";

function DriverHome() {
  const driver = JSON.parse(localStorage.getItem("driverData") || "{}");
  const name = driver?.fullName || driver?.name || "Driver";
  const [stats, setStats] = useState({ loads: 0, earnings: 0, vehicles: 0 });

  useEffect(() => {
    const driverId = driver?._id || driver?.id;
    if (!driverId) return;
    const fetchStats = async () => {
      try {
        const [loadsRes, vehiclesRes] = await Promise.all([
          fetch(`${API_BASE}/api/driver/my-loads?driverId=${driverId}`),
          fetch(`${API_BASE}/api/driver/vehicles?driverId=${driverId}`),
        ]);
        const loads = loadsRes.ok ? await loadsRes.json() : [];
        const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
        const totalEarnings = Array.isArray(loads) ? loads.reduce((s, l) => s + (l.price || 0), 0) : 0;
        setStats({
          loads: Array.isArray(loads) ? loads.length : 0,
          earnings: totalEarnings,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
        });
      } catch { /* silent */ }
    };
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        .dh-hero {
          flex: 1; min-height: calc(100vh - 60px);
          background-image: url('${bgImage}');
          background-size: cover; background-position: center; background-repeat: no-repeat;
          position: relative; display: flex; align-items: center; justify-content: center;
        }
        .dh-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,58,138,0.55) 50%, rgba(15,23,42,0.8) 100%);
        }
        .dh-content {
          position: relative; z-index: 2; text-align: center;
          padding: 40px 24px; max-width: 720px; font-family: 'Inter', sans-serif;
          animation: dhFadeUp 0.7s ease-out;
        }
        .dh-badge {
          display: inline-block; background: rgba(34,197,94,0.15); border: 1px solid rgba(74,222,128,0.3);
          border-radius: 40px; padding: 6px 22px; margin-bottom: 24px;
          font-size: 12px; font-weight: 700; color: #86efac; letter-spacing: 2px; text-transform: uppercase;
          backdrop-filter: blur(8px);
        }
        .dh-heading { font-size: clamp(1.8rem, 5vw, 3rem); font-weight: 900; color: #fff; line-height: 1.15; margin-bottom: 18px; }
        .dh-heading .name { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .dh-heading .earn { background: linear-gradient(135deg, #4ade80, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .dh-sub { font-size: 16px; color: #cbd5e1; margin: 0 auto 36px; line-height: 1.7; max-width: 520px; }
        .dh-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .dh-cta {
          color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 14px;
          font-weight: 800; font-size: 15px; display: inline-flex; align-items: center; gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .dh-cta:hover { transform: translateY(-3px); }
        .dh-cta.primary { background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 10px 30px rgba(34,197,94,0.4); font-size: 16px; padding: 14px 36px; }
        .dh-cta.ghost { background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1.5px solid rgba(255,255,255,0.2); }
        .dh-stats { display: flex; gap: 20px; justify-content: center; margin-top: 48px; flex-wrap: wrap; }
        .dh-stat {
          text-align: center; background: rgba(255,255,255,0.06); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 28px; min-width: 120px;
          animation: dhFadeUp 0.7s ease-out both;
        }
        .dh-stat-icon { font-size: 24px; margin-bottom: 6px; }
        .dh-stat-val { font-size: 22px; font-weight: 900; }
        .dh-stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }

        @keyframes dhFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .dh-content { padding: 30px 16px; }
          .dh-ctas { flex-direction: column; align-items: stretch; gap: 10px; }
          .dh-cta { justify-content: center; padding: 14px 20px !important; font-size: 14px !important; }
          .dh-stats { gap: 10px; }
          .dh-stat { min-width: 90px; padding: 14px 16px; flex: 1; }
          .dh-stat-val { font-size: 18px; }
          .dh-sub { font-size: 14px; margin-bottom: 24px; }
        }
      `}</style>
      <main className="dh-hero">
        <div className="dh-overlay" />
        <div className="dh-content">
          <div className="dh-badge">🚛 TransLogic Driver Portal</div>
          <h1 className="dh-heading">
            Welcome, <span className="name">{name}!</span><br />
            <span className="earn">Ready to Earn Today?</span>
          </h1>
          <p className="dh-sub">Manage your vehicles, accept nearby loads, and track your earnings — all from one place.</p>
          <div className="dh-ctas">
            <a href="/driver/loads" className="dh-cta primary">📦 View New Loads</a>
            <a href="/driver/vehicles" className="dh-cta ghost">🚚 My Vehicles</a>
            <a href="/driver/earnings" className="dh-cta ghost">💰 My Earnings</a>
          </div>
          <div className="dh-stats">
            {[
              { value: stats.loads, label: "Loads Completed", icon: "📦", color: "#60a5fa" },
              { value: `₹${stats.earnings.toLocaleString()}`, label: "Total Earnings", icon: "💰", color: "#4ade80" },
              { value: stats.vehicles, label: "My Vehicles", icon: "🚛", color: "#fbbf24" },
            ].map((s, i) => (
              <div key={i} className="dh-stat" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                <div className="dh-stat-icon">{s.icon}</div>
                <div className="dh-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="dh-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default DriverHome;

