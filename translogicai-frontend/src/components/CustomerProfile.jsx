import React, { useState, useEffect } from "react";
import API_BASE from "../config/api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const statusStyles = {
  Pending:      { bg: "#fef9c3", color: "#854d0e", icon: "⏳" },
  Assigned:     { bg: "#dbeafe", color: "#1e40af", icon: "✅" },
  "In Transit": { bg: "#fef3c7", color: "#92400e", icon: "🚛" },
  Delivered:    { bg: "#dcfce7", color: "#166534", icon: "🎉" },
  Cancelled:    { bg: "#fee2e2", color: "#991b1b", icon: "❌" },
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState(location.pathname.includes("bookings") ? "bookings" : "profile");

  useEffect(() => {
    const cd = JSON.parse(localStorage.getItem("customerData") || "null");
    if (!cd) { navigate("/entry"); return; }
    setCustomer(cd);
    setForm({ name: cd.name || cd.fullName || "", email: cd.email || "", address: cd.address || "" });

    // Fetch fresh profile from backend
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customer/profile/${cd._id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
          setForm({ name: data.name || "", email: data.email || "", address: data.address || "" });
        }
      } catch { /* use localStorage data */ }
    };
    fetchProfile();

    // Fetch bookings
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customer/bookings/${cd.phone}`);
        if (res.ok) setBookings(await res.json());
      } catch { /* silent */ }
    };
    fetchBookings();
  }, [navigate]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile/${customer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        // Update localStorage so navbar etc. reflect changes
        const stored = JSON.parse(localStorage.getItem("customerData") || "{}");
        const updated = { ...stored, name: form.name, email: form.email, address: form.address, fullName: form.name };
        localStorage.setItem("customerData", JSON.stringify(updated));
        setSaveMsg("✅ Profile updated!");
        setEditing(false);
      } else {
        setSaveMsg("❌ " + (data.error || "Update failed"));
      }
    } catch {
      setSaveMsg("❌ Network error");
    }
    setSaving(false);
  };

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ["Pending", "Assigned", "In Transit"].includes(b.status)).length,
    delivered: bookings.filter(b => b.status === "Delivered").length,
    totalSpent: bookings.filter(b => b.status !== "Cancelled").reduce((s, b) => s + (b.price || 0), 0),
  };

  if (!customer) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <style>{`
        .prof-wrap { flex: 1; max-width: 900px; margin: 0 auto; padding: 32px 20px; width: 100%; box-sizing: border-box; }
        .prof-hero { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 20px; padding: 28px 24px; color: #fff; display: flex; align-items: center; gap: 20px; box-shadow: 0 8px 32px rgba(30,58,138,0.25); margin-bottom: 24px; }
        .prof-avatar { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; border: 3px solid rgba(255,255,255,0.5); flex-shrink: 0; }
        .prof-info { flex: 1; min-width: 0; }
        .prof-info h1 { margin: 0; font-size: 22px; font-weight: 900; }
        .prof-info-sub { margin-top: 4px; opacity: 0.85; font-size: 13px; }
        .prof-info-addr { margin-top: 2px; opacity: 0.7; font-size: 12px; }
        .prof-total { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 8px 16px; text-align: center; flex-shrink: 0; }
        .prof-total-val { font-size: 22px; font-weight: 900; }
        .prof-total-lbl { font-size: 10px; opacity: 0.8; font-weight: 600; }
        .prof-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
        .prof-tab { padding: 10px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .prof-tab.active { background: #1d4ed8; color: #fff; border: none; box-shadow: 0 4px 15px rgba(29,78,216,0.3); }
        .prof-tab.inactive { background: #fff; color: #374151; border: 1.5px solid #e2e8f0; }
        .prof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .prof-card { background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
        .prof-card.full { grid-column: 1 / -1; }
        .prof-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .prof-form-full { grid-column: 1 / -1; }
        .prof-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 14px; outline: none; font-family: inherit; box-sizing: border-box; }
        .prof-input:focus { border-color: #3b82f6; }
        .prof-stat { display: flex; align-items: center; gap: 14px; }
        .prof-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .prof-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .prof-action-btn { padding: 10px 18px; border-radius: 10px; color: #fff; font-weight: 700; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 6px; }
        .prof-booking { background: #fff; border-radius: 14px; padding: 16px 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-bottom: 12px; }
        .prof-booking-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; flex-wrap: wrap; }
        .prof-booking-route { font-size: 15px; font-weight: 800; color: #0f172a; }
        .prof-booking-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; }
        .prof-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        @media (max-width: 640px) {
          .prof-wrap { padding: 16px 12px; }
          .prof-hero { flex-direction: column; text-align: center; gap: 14px; padding: 24px 16px; border-radius: 16px; }
          .prof-avatar { width: 60px; height: 60px; font-size: 24px; }
          .prof-info h1 { font-size: 18px; }
          .prof-total { width: 100%; display: flex; gap: 8px; align-items: center; justify-content: center; }
          .prof-total-val { font-size: 18px; }
          .prof-tabs { overflow-x: auto; padding-bottom: 4px; }
          .prof-tab { padding: 8px 18px; font-size: 13px; white-space: nowrap; }
          .prof-grid { grid-template-columns: 1fr; gap: 12px; }
          .prof-form-grid { grid-template-columns: 1fr; }
          .prof-stat-icon { width: 38px; height: 38px; font-size: 18px; }
          .prof-actions { gap: 8px; }
          .prof-action-btn { padding: 8px 14px; font-size: 12px; flex: 1; justify-content: center; min-width: 120px; }
          .prof-booking { padding: 14px; }
          .prof-booking-route { font-size: 14px; }
          .prof-booking-meta { gap: 10px; font-size: 12px; }
        }
      `}</style>

      <div className="prof-wrap">
        {/* Profile Hero */}
        <div className="prof-hero">
          <div className="prof-avatar">
            {(customer.name || customer.fullName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="prof-info">
            <h1>{customer.name || customer.fullName || "Customer"}</h1>
            <div className="prof-info-sub">
              📞 {customer.phone} {customer.email ? ` • ✉️ ${customer.email}` : ""}
            </div>
            <div className="prof-info-addr">📍 {customer.address || "Address not set"}</div>
          </div>
          <div className="prof-total">
            <span className="prof-total-val">{stats.total}</span>
            <span className="prof-total-lbl"> Total Bookings</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="prof-tabs">
          {[
            { key: "profile", label: "👤 Profile" },
            { key: "bookings", label: `📦 Bookings (${stats.total})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`prof-tab ${tab === t.key ? "active" : "inactive"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="prof-grid">
            {/* Personal Info */}
            <div className="prof-card full">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>📋 Personal Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{
                    padding: "8px 20px", borderRadius: 10, background: "#eff6ff",
                    border: "1.5px solid #bfdbfe", color: "#1d4ed8", fontWeight: 700,
                    fontSize: 13, cursor: "pointer",
                  }}>✏️ Edit</button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditing(false); setSaveMsg(""); }} style={{
                      padding: "8px 16px", borderRadius: 10, background: "#f1f5f9",
                      border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600,
                      fontSize: 13, cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{
                      padding: "8px 20px", borderRadius: 10,
                      background: saving ? "#94a3b8" : "#1d4ed8",
                      border: "none", color: "#fff", fontWeight: 700,
                      fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
                    }}>{saving ? "Saving..." : "💾 Save"}</button>
                  </div>
                )}
              </div>

              {saveMsg && (
                <div style={{
                  padding: "8px 14px", borderRadius: 8, marginBottom: 14,
                  background: saveMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
                  color: saveMsg.startsWith("✅") ? "#166534" : "#b91c1c",
                  fontSize: 13, fontWeight: 600,
                }}>{saveMsg}</div>
              )}

              <div className="prof-form-grid">
                {[
                  { label: "Full Name", key: "name", icon: "👤", required: true },
                  { label: "Phone Number", key: "phone", icon: "📞", readonly: true },
                  { label: "Email", key: "email", icon: "✉️" },
                  { label: "Address", key: "address", icon: "📍", required: true, full: true },
                ].map(field => (
                  <div key={field.key} className={field.full ? "prof-form-full" : ""}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 5, display: "block" }}>
                      {field.icon} {field.label}
                      {field.required && <span style={{ color: "#dc2626" }}> *</span>}
                    </label>
                    {editing && !field.readonly ? (
                      <input
                        type="text"
                        className="prof-input"
                        value={form[field.key] || ""}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <div style={{
                        padding: "10px 14px", borderRadius: 10, background: "#f8fafc",
                        border: "1px solid #f1f5f9", fontSize: 14, color: "#0f172a", fontWeight: 500,
                      }}>
                        {field.key === "phone" ? customer.phone : (form[field.key] || "—")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {[
              { label: "Active Shipments", value: stats.active, icon: "🚛", bg: "#eff6ff", color: "#1d4ed8" },
              { label: "Delivered", value: stats.delivered, icon: "✅", bg: "#f0fdf4", color: "#166534" },
              { label: "Total Spent", value: `₹${stats.totalSpent.toLocaleString()}`, icon: "💰", bg: "#fefce8", color: "#854d0e" },
              { label: "Member Since", value: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "N/A", icon: "📅", bg: "#f5f3ff", color: "#6d28d9" },
            ].map((s, i) => (
              <div key={i} className="prof-card">
                <div className="prof-stat">
                  <div className="prof-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <div className="prof-card full">
              <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>⚡ Quick Actions</h3>
              <div className="prof-actions">
                {[
                  { label: "Book a Truck", to: "/book", icon: "🚚", bg: "#1d4ed8" },
                  { label: "Track Shipment", to: "/track", icon: "📍", bg: "#059669" },
                  { label: "View Pricing", to: "/pricing", icon: "💲", bg: "#7c3aed" },
                  { label: "Contact Support", to: "/contact", icon: "📞", bg: "#db2777" },
                ].map(a => (
                  <Link key={a.to} to={a.to} className="prof-action-btn" style={{ background: a.bg, boxShadow: `0 3px 12px ${a.bg}44` }}>
                    {a.icon} {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <div>
            {bookings.length === 0 ? (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "48px 24px",
                textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <h3 style={{ color: "#0f172a", marginBottom: 8 }}>No bookings yet</h3>
                <p style={{ color: "#94a3b8", marginBottom: 20 }}>Start by booking your first truck!</p>
                <Link to="/book" style={{
                  padding: "12px 28px", borderRadius: 12, background: "#1d4ed8",
                  color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14,
                }}>🚚 Book Now</Link>
              </div>
            ) : (
              bookings.map(b => {
                const ss = statusStyles[b.status] || statusStyles.Pending;
                return (
                  <div key={b._id} className="prof-booking" style={{ borderLeft: `4px solid ${ss.color}` }}>
                    <div className="prof-booking-header">
                      <div>
                        <div className="prof-booking-route">📍 {b.pickup} → {b.drop}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                          {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className="prof-badge" style={{ background: ss.bg, color: ss.color }}>
                        {ss.icon} {b.status}
                      </span>
                    </div>
                    <div className="prof-booking-meta">
                      <span style={{ color: "#64748b" }}>💰 <strong style={{ color: "#0f172a" }}>₹{(b.price || 0).toLocaleString()}</strong></span>
                      <span style={{ color: "#64748b" }}>📏 <strong style={{ color: "#0f172a" }}>{b.distanceKm ? `${Math.round(b.distanceKm)} km` : "—"}</strong></span>
                      <span style={{ color: "#64748b" }}>⚖️ <strong style={{ color: "#0f172a" }}>{b.weight ? `${b.weight} kg` : "—"}</strong></span>
                      <span style={{ color: "#64748b" }}>⚡ <strong style={{ color: "#0f172a" }}>{b.urgency}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}


