import React from "react";

function UserTypeCards() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .entry-page {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          font-family: 'Inter', sans-serif; position: relative; overflow: hidden; padding: 40px 20px;
        }

        /* Floating particles */
        .entry-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .entry-particle {
          position: absolute; border-radius: 50%; opacity: 0.15;
          animation: entryFloat 20s infinite ease-in-out;
        }
        .entry-particle:nth-child(1) { width: 300px; height: 300px; background: #3b82f6; top: -80px; left: -80px; animation-delay: 0s; }
        .entry-particle:nth-child(2) { width: 200px; height: 200px; background: #8b5cf6; bottom: -60px; right: -60px; animation-delay: -5s; }
        .entry-particle:nth-child(3) { width: 150px; height: 150px; background: #06b6d4; top: 30%; right: 10%; animation-delay: -10s; }
        .entry-particle:nth-child(4) { width: 100px; height: 100px; background: #f59e0b; bottom: 20%; left: 15%; animation-delay: -15s; }

        @keyframes entryFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 30px) scale(0.9); }
          75% { transform: translate(20px, 10px) scale(1.05); }
        }

        /* Header */
        .entry-header { text-align: center; margin-bottom: 40px; position: relative; z-index: 2; animation: entryFadeUp 0.8s ease-out; }
        .entry-logo-icon { font-size: 56px; margin-bottom: 12px; animation: entryBounce 2s infinite; }
        .entry-title { font-size: 42px; font-weight: 900; letter-spacing: -1px; line-height: 1.1; }
        .entry-title-trans { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .entry-title-ai { background: linear-gradient(135deg, #f59e0b, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-style: italic; }
        .entry-subtitle { color: #94a3b8; font-size: 16px; font-weight: 500; margin-top: 8px; }
        .entry-badges { display: flex; gap: 10px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
        .entry-badge { padding: 6px 16px; border-radius: 40px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); }
        .entry-badge.green { background: rgba(34,197,94,0.15); color: #4ade80; }
        .entry-badge.yellow { background: rgba(234,179,8,0.15); color: #facc15; }
        .entry-badge.blue { background: rgba(59,130,246,0.15); color: #60a5fa; }

        @keyframes entryBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes entryFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Cards */
        .entry-cards { display: flex; gap: 24px; position: relative; z-index: 2; max-width: 700px; width: 100%; }
        .entry-card {
          flex: 1; background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          padding: 36px 28px; text-align: center; display: flex; flex-direction: column; align-items: center;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); cursor: pointer; position: relative; overflow: hidden;
        }
        .entry-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 24px;
          background: linear-gradient(135deg, transparent 0%, rgba(59,130,246,0.08) 100%);
          opacity: 0; transition: opacity 0.3s;
        }
        .entry-card:hover { transform: translateY(-8px); border-color: rgba(59,130,246,0.3); box-shadow: 0 20px 60px rgba(59,130,246,0.2); }
        .entry-card:hover::before { opacity: 1; }
        .entry-card:nth-child(1) { animation: entryFadeUp 0.8s ease-out 0.2s both; }
        .entry-card:nth-child(2) { animation: entryFadeUp 0.8s ease-out 0.4s both; }

        .entry-card-icon { font-size: 48px; margin-bottom: 16px; position: relative; z-index: 1; }
        .entry-card-glow {
          width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; position: relative;
        }
        .entry-card-glow::after {
          content: ''; position: absolute; inset: -8px; border-radius: 50%;
          background: inherit; opacity: 0.3; filter: blur(16px); z-index: 0;
        }
        .entry-card-glow.customer { background: linear-gradient(135deg, #3b82f6, #6366f1); }
        .entry-card-glow.driver { background: linear-gradient(135deg, #f59e0b, #ef4444); }

        .entry-card h2 { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 8px 0; position: relative; z-index: 1; }
        .entry-card p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; position: relative; z-index: 1; }

        .entry-card-features { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 20px; position: relative; z-index: 1; }
        .entry-feature { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.08); color: #cbd5e1; }

        .entry-card-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 14px; font-weight: 800; font-size: 15px;
          text-decoration: none; transition: all 0.25s; position: relative; z-index: 1; border: none; cursor: pointer;
        }
        .entry-card-btn.customer-btn { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; box-shadow: 0 8px 24px rgba(59,130,246,0.35); }
        .entry-card-btn.driver-btn { background: linear-gradient(135deg, #f59e0b, #ea580c); color: #fff; box-shadow: 0 8px 24px rgba(245,158,11,0.35); }
        .entry-card-btn:hover { transform: scale(1.05); }

        /* Steps */
        .entry-steps { display: flex; gap: 12px; align-items: center; margin-top: 40px; position: relative; z-index: 2; animation: entryFadeUp 0.8s ease-out 0.6s both; }
        .entry-step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .entry-step-num {
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 16px; color: #60a5fa;
        }
        .entry-step-label { font-size: 12px; font-weight: 600; color: #64748b; }
        .entry-step-arrow { font-size: 18px; color: #475569; margin: 0 4px; margin-bottom: 24px; }

        /* Truck animation */
        .entry-truck-strip {
          position: absolute; bottom: 60px; left: 0; width: 100%; height: 40px;
          overflow: hidden; pointer-events: none; z-index: 1;
        }
        .entry-truck-inner {
          display: flex; gap: 100px; animation: truckScroll 18s linear infinite; white-space: nowrap;
        }
        .entry-truck-inner span { font-size: 32px; opacity: 0.2; }
        @keyframes truckScroll {
          from { transform: translateX(100vw); }
          to { transform: translateX(-300px); }
        }

        /* Footer */
        .entry-footer {
          position: absolute; bottom: 0; left: 0; right: 0;
          text-align: center; padding: 14px;
          background: rgba(15,23,42,0.8); backdrop-filter: blur(8px);
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #475569; font-size: 12px; font-weight: 500; z-index: 3;
        }
        .entry-footer a { color: #60a5fa; text-decoration: none; margin: 0 12px; }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .entry-page { padding: 24px 16px 80px; }
          .entry-title { font-size: 30px; }
          .entry-subtitle { font-size: 14px; }
          .entry-cards { flex-direction: column; gap: 16px; }
          .entry-card { padding: 28px 20px; }
          .entry-card h2 { font-size: 20px; }
          .entry-steps { gap: 6px; }
          .entry-step-num { width: 36px; height: 36px; font-size: 14px; }
          .entry-step-label { font-size: 10px; }
          .entry-logo-icon { font-size: 42px; }
        }
      `}</style>

      <div className="entry-page">
        {/* Background particles */}
        <div className="entry-particles">
          <div className="entry-particle" />
          <div className="entry-particle" />
          <div className="entry-particle" />
          <div className="entry-particle" />
        </div>

        {/* Header */}
        <div className="entry-header">
          <div className="entry-logo-icon">🚛</div>
          <h1 className="entry-title">
            <span className="entry-title-trans">TransLogic </span>
            <span className="entry-title-ai">AI</span>
          </h1>
          <p className="entry-subtitle">India's Smartest AI-Powered Logistics Platform</p>
          <div className="entry-badges">
            <span className="entry-badge green">✓ Trusted by 10,000+ Users</span>
            <span className="entry-badge yellow">⚡ AI-Powered Pricing</span>
            <span className="entry-badge blue">📍 Real-time Tracking</span>
          </div>
        </div>

        {/* Cards */}
        <div className="entry-cards">
          {/* Customer Card */}
          <div className="entry-card">
            <div className="entry-card-glow customer">
              <span style={{ fontSize: 36, position: "relative", zIndex: 1 }}>🧑‍💼</span>
            </div>
            <h2>Customers</h2>
            <p>Book trucks instantly, negotiate AI-powered prices, and track your shipments in real-time.</p>
            <div className="entry-card-features">
              <span className="entry-feature">📦 Instant Booking</span>
              <span className="entry-feature">💰 Smart Pricing</span>
              <span className="entry-feature">📍 Live Tracking</span>
            </div>
            <a href="/login-customer" className="entry-card-btn customer-btn">
              Get Started →
            </a>
          </div>

          {/* Driver Card */}
          <div className="entry-card">
            <div className="entry-card-glow driver">
              <span style={{ fontSize: 36, position: "relative", zIndex: 1 }}>🚚</span>
            </div>
            <h2>Drivers</h2>
            <p>Access more loads, get fair pricing, and manage your trips with our smart driver portal.</p>
            <div className="entry-card-features">
              <span className="entry-feature">📋 Smart Loads</span>
              <span className="entry-feature">💵 Fast Payments</span>
              <span className="entry-feature">📊 Trip Analytics</span>
            </div>
            <a href="/login-driver" className="entry-card-btn driver-btn">
              Start Driving →
            </a>
          </div>
        </div>

        {/* How it works steps */}
        <div className="entry-steps">
          <div className="entry-step">
            <div className="entry-step-num">1</div>
            <div className="entry-step-label">Choose Role</div>
          </div>
          <span className="entry-step-arrow">→</span>
          <div className="entry-step">
            <div className="entry-step-num">2</div>
            <div className="entry-step-label">Sign Up</div>
          </div>
          <span className="entry-step-arrow">→</span>
          <div className="entry-step">
            <div className="entry-step-num">3</div>
            <div className="entry-step-label">Start!</div>
          </div>
        </div>

        {/* Truck animation strip */}
        <div className="entry-truck-strip">
          <div className="entry-truck-inner">
            <span>🚚</span><span>🚛</span><span>🚚</span><span>🚛</span><span>🚚</span><span>🚛</span>
          </div>
        </div>

        {/* Footer */}
        <div className="entry-footer">
          <a href="/contact">Contact</a>•<a href="/how-it-works">How It Works</a>•<a href="/pricing">Pricing</a>
          <div style={{ marginTop: 4 }}>© 2026 TransLogic AI. All rights reserved.</div>
        </div>
      </div>
    </>
  );
}

export default UserTypeCards;
