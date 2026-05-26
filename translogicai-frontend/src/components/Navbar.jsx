import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const customer = JSON.parse(localStorage.getItem("customerData") || "{}");
  const name = customer?.fullName || customer?.name || "";
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    localStorage.removeItem("customerData");
    navigate("/entry");
  };

  useEffect(() => {
    const loadNotifs = () => {
      const stored = JSON.parse(localStorage.getItem("customerNotifications") || "[]");
      setNotifications(stored);
    };
    loadNotifs();
    const timer = setInterval(loadNotifs, 10000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("customerNotifications", JSON.stringify(updated));
  };

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); }, [location]);

  const navLinks = [
    { to: "/customer/home", label: "Home" },
    { to: "/book", label: "Book a Truck" },
    { to: "/track", label: "Track" },
    { to: "/pricing", label: "Pricing" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .cust-nav { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); box-shadow: 0 4px 20px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 1000; font-family: 'Inter', sans-serif; }
        .cust-nav-inner { max-width: 1320px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; height: 60px; }
        .cust-logo { text-decoration: none; display: flex; flex-direction: column; justify-content: center; }
        .cust-logo-main { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; }
        .cust-logo-ai { font-style: italic; background: linear-gradient(135deg, #f59e0b, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .cust-logo-sub { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 1px; }
        .cust-desktop-links { display: flex; gap: 4px; align-items: center; }
        .cust-nav-link { text-decoration: none; color: #94a3b8; font-weight: 600; font-size: 13px; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; white-space: nowrap; }
        .cust-nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .cust-nav-link.active { color: #fff; background: rgba(59,130,246,0.2); }
        .cust-right { display: flex; align-items: center; gap: 8px; }
        .cust-icon-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.15s; }
        .cust-icon-btn:hover { background: rgba(255,255,255,0.15); }
        .cust-badge { position: absolute; top: -3px; right: -3px; background: #ef4444; color: #fff; border-radius: 20px; font-size: 9px; font-weight: 800; padding: 1px 5px; min-width: 14px; text-align: center; border: 2px solid #0f172a; }
        .cust-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; font-weight: 800; font-size: 13px; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.35); }
        .cust-dropdown { position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; overflow: hidden; z-index: 999; }
        .cust-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; text-decoration: none; color: #374151; font-size: 14px; font-weight: 500; transition: background 0.1s; cursor: pointer; border: none; width: 100%; background: none; text-align: left; }
        .cust-dropdown-item:hover { background: #f0f9ff; }
        .cust-dropdown-item.danger { color: #dc2626; font-weight: 600; border-top: 1px solid #f1f5f9; }
        .cust-dropdown-item.danger:hover { background: #fef2f2; }
        /* Hamburger */
        .cust-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .cust-hamburger span { display: block; width: 22px; height: 2.5px; background: #94a3b8; margin: 4px 0; border-radius: 2px; transition: all 0.3s; }
        .cust-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
        .cust-hamburger.open span:nth-child(2) { opacity: 0; }
        .cust-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        /* Mobile drawer */
        .cust-mobile-drawer { display: none; position: fixed; top: 60px; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.98); backdrop-filter: blur(16px); z-index: 9999; flex-direction: column; padding: 20px 24px; animation: slideDown 0.25s ease; }
        .cust-mobile-drawer.open { display: flex; }
        .cust-mobile-link { text-decoration: none; color: #e2e8f0; font-weight: 600; font-size: 17px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: block; }
        .cust-mobile-link:hover { color: #60a5fa; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .cust-desktop-links { display: none !important; }
          .cust-hamburger { display: block !important; }
          .cust-nav-inner { padding: 0 12px; }
          .cust-logo-main { font-size: 19px; }
        }
      `}</style>

      <nav className="cust-nav">
        <div className="cust-nav-inner">
          {/* Logo */}
          <Link to="/customer/home" className="cust-logo">
            <span className="cust-logo-main">
              TransLogic <span className="cust-logo-ai">AI</span>
            </span>
            <span className="cust-logo-sub">for customers</span>
          </Link>

          {/* Desktop Links */}
          <div className="cust-desktop-links">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`cust-nav-link ${location.pathname === link.to ? "active" : ""}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="cust-right">
            {/* Bell */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="cust-icon-btn" onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }} title="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && <span className="cust-badge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="cust-dropdown" style={{ width: 320 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>🔔 Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark all read</button>}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                        <div style={{ fontSize: 13 }}>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", background: n.read ? "#fff" : "#f0f9ff" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{n.time ? new Date(n.time).toLocaleString() : ""}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button className="cust-avatar" onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }} title={name || "Profile"}>
                {initials}
              </button>
              {profileOpen && (
                <div className="cust-dropdown" style={{ minWidth: 200 }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8faff" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{name || "Guest"}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{customer?.phone || ""}</div>
                  </div>
                  {[
                    { icon: "👤", label: "My Profile", to: "/customer/profile" },
                    { icon: "📦", label: "My Bookings", to: "/customer/bookings" },
                    { icon: "📍", label: "Track Shipment", to: "/track" },
                    { icon: "⚙️", label: "Settings", to: "/customer/settings" },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)} className="cust-dropdown-item">
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="cust-dropdown-item danger">
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button className={`cust-hamburger ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(p => !p)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`cust-mobile-drawer ${mobileOpen ? "open" : ""}`}>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className="cust-mobile-link" onClick={() => setMobileOpen(false)}>
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}

export default Navbar;
