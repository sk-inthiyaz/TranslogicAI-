import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import API_BASE from "../config/api";

function DriverNavbar() {
  const [photo, setPhoto] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loadCount, setLoadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const driverData = JSON.parse(localStorage.getItem("driverData") || "{}");
  const driverId = driverData._id || driverData.id || "";
  const driverInitial = (driverData.fullName || driverData.name || "D").charAt(0).toUpperCase();

  useEffect(() => {
    if (driverData?.photo) setPhoto(`${API_BASE}${driverData.photo}`);
    else setPhoto("");

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const fetchData = async () => {
      if (!driverId) return;
      try {
        const notifRes = await fetch(`${API_BASE}/api/driver/notifications?driverId=${driverId}`);
        const notifData = await notifRes.json();
        if (notifData.notifications) { setNotifications(notifData.notifications); setNotifCount(notifData.unreadCount || 0); }
      } catch { /* silent */ }
      try {
        const loadRes = await fetch(`${API_BASE}/api/driver/pending-loads?driverId=${driverId}`);
        const loadData = await loadRes.json();
        if (Array.isArray(loadData)) setLoadCount(loadData.length);
      } catch { /* silent */ }
    };
    fetchData();
    const timer = setInterval(fetchData, 15000);
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); }, [location]);

  const markAllRead = async () => {
    if (!driverId) return;
    try {
      await fetch(`${API_BASE}/api/driver/notifications/mark-read`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setNotifCount(0);
    } catch { /* silent */ }
  };

  const totalBadge = notifCount + loadCount;

  const handleLogout = () => {
    localStorage.removeItem("driverData");
    navigate("/entry");
  };

  function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  const navLinks = [
    { to: "/driver/home", label: "Home" },
    { to: "/driver/vehicles", label: "My Vehicles" },
    { to: "/driver/loads", label: "Loads", badge: loadCount },
    { to: "/driver/earnings", label: "Earnings" },
    { to: "/driver/contact", label: "Support" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .drv-nav { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); box-shadow: 0 4px 20px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 1000; font-family: 'Inter', sans-serif; }
        .drv-nav-inner { max-width: 1320px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; height: 60px; }
        .drv-logo { text-decoration: none; display: flex; flex-direction: column; justify-content: center; }
        .drv-logo-main { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; }
        .drv-logo-ai { font-style: italic; background: linear-gradient(135deg, #f59e0b, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .drv-logo-sub { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 1px; }
        .drv-desktop-links { display: flex; gap: 4px; align-items: center; }
        .drv-nav-link { text-decoration: none; color: #94a3b8; font-weight: 600; font-size: 13px; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; white-space: nowrap; position: relative; }
        .drv-nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .drv-nav-link.active { color: #fff; background: rgba(245,158,11,0.2); }
        .drv-link-badge { position: absolute; top: 0; right: 0; background: #ef4444; color: #fff; border-radius: 20px; font-size: 9px; font-weight: 800; padding: 1px 5px; min-width: 14px; text-align: center; }
        .drv-right { display: flex; align-items: center; gap: 8px; }
        .drv-icon-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.15s; }
        .drv-icon-btn:hover { background: rgba(255,255,255,0.15); }
        .drv-badge { position: absolute; top: -3px; right: -3px; background: #ef4444; color: #fff; border-radius: 20px; font-size: 9px; font-weight: 800; padding: 1px 5px; min-width: 14px; text-align: center; border: 2px solid #0f172a; }
        .drv-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #fff; font-weight: 800; font-size: 13px; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(245,158,11,0.35); overflow: hidden; }
        .drv-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .drv-dropdown { position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; overflow: hidden; z-index: 999; min-width: 160px; }
        .drv-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; text-decoration: none; color: #374151; font-size: 14px; font-weight: 500; transition: background 0.1s; cursor: pointer; border: none; width: 100%; background: none; text-align: left; }
        .drv-dropdown-item:hover { background: #fefce8; }
        .drv-dropdown-item.danger { color: #dc2626; font-weight: 600; border-top: 1px solid #f1f5f9; }
        .drv-dropdown-item.danger:hover { background: #fef2f2; }

        /* Hamburger */
        .drv-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .drv-hamburger span { display: block; width: 22px; height: 2.5px; background: #94a3b8; margin: 4px 0; border-radius: 2px; transition: all 0.3s; }
        .drv-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
        .drv-hamburger.open span:nth-child(2) { opacity: 0; }
        .drv-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        /* Mobile drawer */
        .drv-mobile-drawer { display: none; position: fixed; top: 60px; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.98); backdrop-filter: blur(16px); z-index: 9999; flex-direction: column; padding: 20px 24px; animation: drvSlideDown 0.25s ease; }
        .drv-mobile-drawer.open { display: flex; }
        .drv-mobile-link { text-decoration: none; color: #e2e8f0; font-weight: 600; font-size: 17px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .drv-mobile-link:hover { color: #f59e0b; }
        .drv-mobile-badge { background: #ef4444; color: #fff; border-radius: 20px; font-size: 11px; font-weight: 800; padding: 2px 8px; }
        .drv-mobile-logout { margin-top: auto; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); }
        .drv-mobile-logout-btn { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; border: none; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; }

        @keyframes drvSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* Notification panel */
        .drv-notif-panel { position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border-radius: 14px; width: 340px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; overflow: hidden; z-index: 999; color: #0f172a; }

        @media (max-width: 768px) {
          .drv-desktop-links { display: none !important; }
          .drv-hamburger { display: block !important; }
          .drv-nav-inner { padding: 0 12px; }
          .drv-logo-main { font-size: 19px; }
          .drv-notif-panel { position: fixed; top: 60px; left: 8px; right: 8px; width: auto; }
        }
      `}</style>

      <nav className="drv-nav">
        <div className="drv-nav-inner">
          {/* Logo */}
          <Link to="/driver/home" className="drv-logo">
            <span className="drv-logo-main">
              TransLogic <span className="drv-logo-ai">AI</span>
            </span>
            <span className="drv-logo-sub">for drivers</span>
          </Link>

          {/* Desktop Links */}
          <div className="drv-desktop-links">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`drv-nav-link ${location.pathname === link.to ? 'active' : ''}`}>
                {link.label}
                {link.badge > 0 && <span className="drv-link-badge">{link.badge}</span>}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="drv-right">
            {/* Hamburger (mobile only) */}
            <button className={`drv-hamburger ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(p => !p)}>
              <span /><span /><span />
            </button>

            {/* Bell */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="drv-icon-btn" onClick={() => { setNotifOpen(p => !p); setDropdownOpen(false); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {totalBadge > 0 && <span className="drv-badge">{totalBadge}</span>}
              </button>

              {notifOpen && (
                <div className="drv-notif-panel">
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>🔔 Notifications</span>
                    {notifCount > 0 && (
                      <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark all read</button>
                    )}
                  </div>
                  {loadCount > 0 && (
                    <Link to="/driver/loads" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#eff6ff", borderBottom: "1px solid #dbeafe", textDecoration: "none" }}>
                      <span style={{ fontSize: 20 }}>📦</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{loadCount} new load{loadCount > 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Tap to view and accept</div>
                      </div>
                    </Link>
                  )}
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifications.length === 0 && loadCount === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                        <div style={{ fontSize: 13 }}>No notifications</div>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", background: n.read ? "#fff" : "#f0fdf4" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button className="drv-avatar" onClick={() => { setDropdownOpen(p => !p); setNotifOpen(false); }}>
                {photo ? <img src={photo} alt="Profile" /> : driverInitial}
              </button>
              {dropdownOpen && (
                <div className="drv-dropdown">
                  <Link to="/driver/profile" className="drv-dropdown-item">👤 My Profile</Link>
                  <Link to="/driver/vehicles" className="drv-dropdown-item">🚛 My Vehicles</Link>
                  <button className="drv-dropdown-item danger" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`drv-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className="drv-mobile-link">
            <span>{link.label}</span>
            {link.badge > 0 && <span className="drv-mobile-badge">{link.badge}</span>}
          </Link>
        ))}
        <Link to="/driver/profile" className="drv-mobile-link">My Profile</Link>
        <div className="drv-mobile-logout">
          <button className="drv-mobile-logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>
    </>
  );
}

export default DriverNavbar;
