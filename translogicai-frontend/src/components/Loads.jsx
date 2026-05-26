import React, { useState, useEffect, useCallback } from "react";
import API_BASE from "../config/api";

const API = `${API_BASE}/api/driver`;

const CITIES = [
  "Hyderabad","Vijayawada","Visakhapatnam","Warangal","Guntur","Nellore",
  "Kurnool","Rajahmundry","Karimnagar","Khammam","Tirupati","Kakinada",
  "Nalgonda","Nizamabad","Siddipet","Mahbubnagar","Eluru","Ongole",
  "Mumbai","Delhi","Chennai","Bengaluru","Kolkata","Pune","Nagpur",
  "Ahmedabad","Jaipur","Lucknow","Surat","Hyderabad"
].filter((v,i,a) => a.indexOf(v)===i).sort();

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  return `${Math.floor(diff/3600)}h ago`;
}

const urgencyColor = { High: "#dc2626", Medium: "#d97706", Low: "#16a34a" };
const urgencyBg   = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };

export default function Loads() {
  const driver = JSON.parse(localStorage.getItem("driverData") || "{}");
  const driverId = driver._id || driver.id || "";

  const [tab, setTab]               = useState("notifications"); // "notifications" | "myloads"
  const [pendingLoads, setPending]  = useState([]);
  const [myLoads, setMyLoads]       = useState([]);
  const [location, setLocation]     = useState(driver.location || "");
  const [locInput, setLocInput]     = useState(driver.location || "");
  const [locSaving, setLocSaving]   = useState(false);
  const [locSaved, setLocSaved]     = useState(false);
  const [actionId, setActionId]     = useState(null);
  const [selectedLoad, setSelected] = useState(null);
  const [error, setError]           = useState("");
  const [locWarning, setLocWarning] = useState("");
  // Vehicle picker — shown when driver has >1 vehicle near the load
  const [vehiclePicker, setVehiclePicker] = useState(null); // { load, vehicles[] }

  // ── Fetch pending loads ──────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    if (!driverId) return;
    try {
      const res = await fetch(`${API}/pending-loads?driverId=${driverId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPending(data);
        setLocWarning("");
      } else if (data.noCoords) {
        // Driver has no coordinates — prompt them to set location
        setPending([]);
        setLocWarning(data.warning || "Please set your current city to see nearby loads.");
      }
    } catch { /* silent */ }
  }, [driverId]);

  // ── Fetch my accepted loads ───────────────────────────────────────────────
  const fetchMyLoads = useCallback(async () => {
    if (!driverId) return;
    try {
      const res = await fetch(`${API}/my-loads?driverId=${driverId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMyLoads(data);
    } catch { /* silent */ }
  }, [driverId]);

  useEffect(() => {
    fetchPending();
    fetchMyLoads();
    // Poll every 15 seconds for new loads
    const timer = setInterval(() => { fetchPending(); fetchMyLoads(); }, 15000);
    return () => clearInterval(timer);
  }, [fetchPending, fetchMyLoads]);

  // ── Update location ───────────────────────────────────────────────────────
  const handleUpdateLocation = async () => {
    if (!locInput.trim()) return;
    setLocSaving(true); setError("");
    try {
      const res = await fetch(`${API}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, location: locInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocation(data.location);
        setLocSaved(true);
        // Persist to localStorage too
        const updated = { ...driver, location: data.location };
        localStorage.setItem("driverData", JSON.stringify(updated));
        setTimeout(() => setLocSaved(false), 2500);
      } else setError(data.error || "Failed to update location");
    } catch { setError("Network error"); }
    setLocSaving(false);
  };

  // ── Accept load ───────────────────────────────────────────────────────────
  // Called with a chosen vehicleId (from picker or auto-selected)
  const doAccept = async (loadId, vehicleId) => {
    setActionId(loadId); setError("");
    try {
      const res = await fetch(`${API}/accept-load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, loadId, vehicleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setVehiclePicker(null); setSelected(null);
        await fetchPending(); await fetchMyLoads();
        setTab("myloads");
      } else setError(data.error || "Could not accept load");
    } catch { setError("Network error"); }
    setActionId(null);
  };

  // handleAccept — shows vehicle picker if multiple nearby, else accepts directly
  const handleAccept = (loadId) => {
    const load = pendingLoads.find(l => l._id === loadId);
    const vehicles = load?.nearbyVehicles || [];
    if (vehicles.length > 1) {
      // Multiple vehicles near this load — let driver choose
      setVehiclePicker({ load, vehicles });
    } else {
      // Only one vehicle (or none) — accept directly
      doAccept(loadId, vehicles[0]?.vehicleId || null);
    }
  };

  // ── Reject load ───────────────────────────────────────────────────────────
  const handleReject = async (loadId) => {
    setActionId(loadId); setError("");
    try {
      const res = await fetch(`${API}/reject-load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, loadId }),
      });
      if (res.ok) {
        setSelected(null);
        await fetchPending();
      } else { const d = await res.json(); setError(d.error || "Failed"); }
    } catch { setError("Network error"); }
    setActionId(null);
  };

  const statusStyle = (s) => {
    const map = {
      Pending:    { bg:"#fef9c3", color:"#854d0e" },
      Assigned:   { bg:"#dbeafe", color:"#1e40af" },
      "In Transit":{ bg:"#fef3c7", color:"#92400e"},
      Delivered:  { bg:"#dcfce7", color:"#166534" },
      Cancelled:  { bg:"#fee2e2", color:"#991b1b" },
    };
    return map[s] || { bg:"#f1f5f9", color:"#475569" };
  };

  if (!driverId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <p>Please log in as a driver to see loads.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "'Inter',sans-serif" }}>

      {/* ── Location Update Bar ── */}
      <div style={{
        background: "#eff6ff", border: "1px solid #bfdbfe",
        borderRadius: 14, padding: "16px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 20 }}>📍</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>
            YOUR CURRENT LOCATION
            {location && <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 700 }}>({location})</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={locInput}
              onChange={e => setLocInput(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #93c5fd",
                fontSize: 14, background: "#fff", color: "#1e293b", outline: "none",
              }}
            >
              <option value="">-- Select your city --</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={handleUpdateLocation}
              disabled={locSaving || !locInput}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: locSaved ? "#16a34a" : "linear-gradient(90deg,#3b82f6,#06b6d4)",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {locSaving ? "Saving…" : locSaved ? "✓ Saved!" : "Update Location"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
          padding: "10px 14px", marginBottom: 14, color: "#b91c1c", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Tab Header ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {[
          { key: "notifications", label: "🔔 New Loads", count: pendingLoads.length },
          { key: "myloads",       label: "📦 My Loads",  count: myLoads.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 22px", fontWeight: 700, fontSize: 14, border: "none",
            background: "none", cursor: "pointer", borderBottom: tab === t.key ? "3px solid #3b82f6" : "3px solid transparent",
            color: tab === t.key ? "#1d4ed8" : "#64748b", marginBottom: -2,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: t.key === "notifications" ? "#dc2626" : "#3b82f6",
                color: "#fff", borderRadius: 20, fontSize: 11,
                fontWeight: 800, padding: "1px 7px",
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notifications Tab — Pending Loads ── */}
      {tab === "notifications" && (
        <div>
          {/* Location warning — shown if driver has no coords */}
          {locWarning && (
            <div style={{
              background: "#fffbeb", border: "1.5px solid #f59e0b",
              borderRadius: 12, padding: "14px 18px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14 }}>
                  Location Not Set
                </div>
                <div style={{ color: "#78350f", fontSize: 13, marginTop: 2 }}>
                  {locWarning} Use the city selector above and click "Update Location".
                </div>
              </div>
            </div>
          )}

          {pendingLoads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🚛</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No new loads right now</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Refreshes every 15 seconds. Make sure your location is set.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pendingLoads.map(load => (
                <div key={load._id} style={{
                  background: load.urgency === "High" ? "#fef2f2" : load.urgency === "Low" ? "#f0fdf4" : "#fffbeb",
                  border: `1.5px solid ${load.urgency === "High" ? "#fecaca" : load.urgency === "Low" ? "#bbf7d0" : "#fde68a"}`,
                  borderRadius: 14, padding: "18px 20px",
                  boxShadow: `0 2px 10px ${load.urgency === "High" ? "rgba(220,38,38,0.08)" : load.urgency === "Low" ? "rgba(22,163,74,0.08)" : "rgba(217,119,6,0.08)"}`,
                  borderLeft: `5px solid ${urgencyColor[load.urgency] || "#3b82f6"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        📦 {load.pickup} → {load.drop}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        ⚖️ {load.weight} kg &nbsp;|&nbsp; 👤 {load.customerName} &nbsp;|&nbsp; 🕐 {timeAgo(load.createdAt)}
                        {load.distanceFromDriver !== undefined && (
                          <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 700 }}>
                            📍 {load.distanceFromDriver} km from nearest vehicle
                          </span>
                        )}
                      </div>
                      {/* Nearby vehicles chips */}
                      {load.nearbyVehicles?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {load.nearbyVehicles.map(v => (
                            <span key={v.vehicleId} style={{
                              background: "#eff6ff", border: "1px solid #bfdbfe",
                              borderRadius: 20, padding: "2px 10px",
                              fontSize: 11, fontWeight: 700, color: "#1d4ed8",
                            }}>
                              🚛 {v.vehicleNumber} — {v.distanceKm} km away
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{
                        background: urgencyBg[load.urgency], color: urgencyColor[load.urgency],
                        fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      }}>{load.urgency} Urgency</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>
                        ₹{load.price?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button
                      onClick={() => handleAccept(load._id)}
                      disabled={actionId === load._id}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, border: "none",
                        background: "linear-gradient(90deg,#16a34a,#22c55e)",
                        color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                        boxShadow: "0 3px 10px rgba(34,197,94,0.3)",
                      }}
                    >
                      {actionId === load._id ? "Processing…"
                        : load.nearbyVehicles?.length > 1
                          ? "🚛 Choose Vehicle & Accept"
                          : "✅ Accept Load"}
                    </button>
                    <button
                      onClick={() => handleReject(load._id)}
                      disabled={actionId === load._id}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10,
                        border: "1.5px solid #fca5a5", background: "#fff",
                        color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer",
                      }}
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => setSelected(load)}
                      style={{
                        padding: "10px 16px", borderRadius: 10,
                        border: "1.5px solid #bfdbfe", background: "#eff6ff",
                        color: "#1d4ed8", fontWeight: 600, fontSize: 13, cursor: "pointer",
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Loads Tab ── */}
      {tab === "myloads" && (
        <div>
          {myLoads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No accepted loads yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {myLoads.map(load => {
                const ss = statusStyle(load.status);
                return (
                  <div key={load._id} style={{
                    background: "#fff", border: "1.5px solid #e2e8f0",
                    borderRadius: 16, padding: "20px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  }}>
                    {/* Route + Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
                        📦 {load.pickup} → {load.drop}
                      </div>
                      <span style={{
                        background: ss.bg, color: ss.color,
                        fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                      }}>{load.status}</span>
                    </div>

                    {/* Load details row */}
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                      <span>⚖️ <b>{load.weight} kg</b></span>
                      <span>💰 <b style={{ color: "#1d4ed8" }}>₹{load.price?.toLocaleString("en-IN") || "—"}</b></span>
                      <span>🚨 <b>{load.urgency}</b></span>
                      {load.distanceKm && <span>📏 <b>{load.distanceKm.toFixed(1)} km</b></span>}
                    </div>

                    {/* Customer info card — prominent */}
                    <div style={{
                      background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                      border: "1.5px solid #93c5fd", borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: 10,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", marginBottom: 4, letterSpacing: 0.5 }}>
                          CUSTOMER DETAILS
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1e3a8a" }}>
                          👤 {load.customerName || "—"}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1d4ed8", marginTop: 2 }}>
                          📞 {load.customerPhone || "—"}
                        </div>
                      </div>
                      <a
                        href={`tel:${load.customerPhone}`}
                        style={{
                          padding: "10px 20px", borderRadius: 10,
                          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                          color: "#fff", fontWeight: 700, fontSize: 14,
                          textDecoration: "none",
                          boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                        }}
                      >
                        📞 Call Customer
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Load Detail Modal ── */}
      {selectedLoad && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 18, padding: 28, maxWidth: 480, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative",
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: 14, right: 16,
              background: "#f1f5f9", border: "none", borderRadius: 8,
              padding: "4px 10px", cursor: "pointer", fontSize: 16, color: "#64748b",
            }}>✕</button>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18, color: "#0f172a" }}>
              📋 Load Details
            </h3>

            {/* Customer Contact Card */}
            <div style={{
              background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
              border: "1.5px solid #93c5fd", borderRadius: 12,
              padding: "14px 16px", marginBottom: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", marginBottom: 4 }}>CUSTOMER</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e3a8a" }}>👤 {selectedLoad.customerName}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1d4ed8", marginTop: 2 }}>📞 {selectedLoad.customerPhone}</div>
              </div>
              <a href={`tel:${selectedLoad.customerPhone}`} style={{
                padding: "9px 18px", borderRadius: 10,
                background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                textDecoration: "none", whiteSpace: "nowrap",
              }}>
                📞 Call
              </a>
            </div>

            {[
              ["📍 Pickup",  selectedLoad.pickup],
              ["🏁 Drop",    selectedLoad.drop],
              ["⚖️ Weight",  `${selectedLoad.weight} kg`],
              ["💰 Price",   `₹${selectedLoad.price?.toLocaleString("en-IN") || "—"}`],
              ["🚨 Urgency", selectedLoad.urgency],
              ["📦 Cargo",   selectedLoad.cargo],
              ["🕐 Posted",  timeAgo(selectedLoad.createdAt)],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", padding: "8px 0",
                borderBottom: "1px solid #f1f5f9", fontSize: 14,
              }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{val}</span>
              </div>
            ))}

            {/* Nearby vehicles in modal */}
            {selectedLoad.nearbyVehicles?.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                  YOUR NEARBY VEHICLES
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedLoad.nearbyVehicles.map(v => (
                    <span key={v.vehicleId} style={{
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: 20, padding: "3px 12px",
                      fontSize: 12, fontWeight: 700, color: "#1d4ed8",
                    }}>
                      🚛 {v.vehicleNumber} — {v.distanceKm} km
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => handleAccept(selectedLoad._id)}
                disabled={actionId === selectedLoad._id}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "none",
                  background: "linear-gradient(90deg,#16a34a,#22c55e)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                {actionId === selectedLoad._id ? "Processing…"
                  : selectedLoad.nearbyVehicles?.length > 1
                    ? "🚛 Choose Vehicle & Accept"
                    : "✅ Accept"}
              </button>
              <button onClick={() => handleReject(selectedLoad._id)}
                disabled={actionId === selectedLoad._id}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  border: "1.5px solid #fca5a5", background: "#fff",
                  color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Picker Modal ── */}
      {vehiclePicker && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 28,
            maxWidth: 480, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
              🚛 Choose a Vehicle
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              {vehiclePicker.vehicles.length} of your vehicles are near{" "}
              <b>{vehiclePicker.load.pickup}</b>. Select which truck to dispatch:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {vehiclePicker.vehicles.map(v => (
                <button
                  key={v.vehicleId}
                  onClick={() => doAccept(vehiclePicker.load._id, v.vehicleId)}
                  disabled={actionId === vehiclePicker.load._id}
                  style={{
                    padding: "14px 18px", borderRadius: 14,
                    border: "2px solid #bfdbfe", background: "#eff6ff",
                    cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#3b82f6"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1e3a8a", marginBottom: 4 }}>
                    🚛 {v.vehicleNumber}
                  </div>
                  <div style={{ fontSize: 13, color: "#3b82f6" }}>
                    {v.vehicleName} &nbsp;·&nbsp; 📍 {v.distanceKm} km from pickup
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setVehiclePicker(null)}
              style={{
                width: "100%", padding: "10px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontWeight: 600, cursor: "pointer",
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

