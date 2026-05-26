import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";

const CITIES = [
  "Hyderabad","Secunderabad","Ghatkesar","Warangal","Karimnagar","Khammam",
  "Nizamabad","Nalgonda","Siddipet","Mahbubnagar","Medak",
  "Vijayawada","Visakhapatnam","Guntur","Nellore","Kurnool","Rajahmundry",
  "Tirupati","Kadapa","Anantapur","Eluru","Ongole","Kakinada","Nandyal","Chittoor",
  "Chennai","Coimbatore","Madurai",
  "Bangalore","Mysore","Hubli",
  "Mumbai","Pune","Nagpur",
  "Delhi","Kolkata","Ahmedabad","Surat","Jaipur","Lucknow",
].sort();

const initialVehicle = { vehicleNumber: "", vehicleName: "", capacity: "" };

const STATUS_STYLE = {
  Activated: { bg: "#dcfce7", color: "#166534", label: "✅ Activated" },
  Pending:   { bg: "#fef9c3", color: "#854d0e", label: "⏳ Pending Review" },
  Rejected:  { bg: "#fee2e2", color: "#991b1b", label: "❌ Rejected" },
};

export default function MyVehicles() {
  const [vehicles, setVehicles]       = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [showUpload, setShowUpload]   = useState(false);
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [locInputs, setLocInputs]     = useState({});   // vehicleId → selected city
  const [savingId, setSavingId]       = useState(null);
  const [savedId, setSavedId]         = useState(null);
  const navigate = useNavigate();

  const driverData = JSON.parse(localStorage.getItem("driverData") || "{}");
  const driverId   = driverData._id || driverData.id || "";

  const fetchVehicles = useCallback(async () => {
    if (!driverId) return;
    try {
      const res  = await fetch(`${API_BASE}/api/vehicle/list/driver/${driverId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setVehicles(data);
        const init = {};
        data.forEach(v => { if (v.location) init[v._id] = v.location; });
        setLocInputs(prev => ({ ...init, ...prev }));
      }
    } catch { /* silent */ }
  }, [driverId]);

  useEffect(() => {
    if (!driverId) { navigate("/login-driver"); return; }
    fetchVehicles();
  }, [driverId, navigate, fetchVehicles]);

  // ── Add vehicle form ────────────────────────────────────────────────────────
  const handleVehicleSubmit = e => {
    e.preventDefault();
    setShowUpload(true);
    setUploadingFor(vehicleForm.vehicleNumber);
  };

  const handleFileChange = e => {
    if (e.target.type === "file") {
      setUploadFiles({ ...uploadFiles, [e.target.name]: e.target.files[0] });
    } else {
      setUploadFiles({ ...uploadFiles, [e.target.name]: e.target.value });
    }
  };

  const handleUploadSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("driverId", driverId);
    formData.append("vehicleNumber", vehicleForm.vehicleNumber);
    formData.append("vehicleName", vehicleForm.vehicleName);
    formData.append("capacity", vehicleForm.capacity);
    formData.append("driverName", uploadFiles.driverName || "");
    ["permit","rc","fitness","puc","insurance","vehicleImage","driverLicence","driverImage","tax"]
      .forEach(f => { if (uploadFiles[f]) formData.append(f, uploadFiles[f]); });
    try {
      const res  = await fetch(`${API_BASE}/api/vehicle/add`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        fetchVehicles();
        setShowUpload(false); setUploadFiles({});
        setUploadingFor(null); setVehicleForm(initialVehicle);
      } else alert(data.error || "Upload failed");
    } catch { alert("Network error"); }
  };

  // ── Save vehicle location ───────────────────────────────────────────────────
  const handleSaveLocation = async vehicleId => {
    const city = locInputs[vehicleId];
    if (!city) return;
    setSavingId(vehicleId);
    try {
      const res  = await fetch(`${API_BASE}/api/vehicle/${vehicleId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: city }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedId(vehicleId);
        setTimeout(() => setSavedId(null), 2500);
        fetchVehicles();
      } else alert(data.error || "Failed to save location");
    } catch { alert("Network error"); }
    setSavingId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px", fontFamily: "'Inter',sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>🚛 My Vehicles</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
        Manage your vehicles and update their city location. Load notifications are shown on the{" "}
        <a href="/driver/loads" style={{ color: "#1d4ed8", fontWeight: 700 }}>Loads page</a>.
      </p>

      {/* ── Add Vehicle Form ────────────────────────────────────────────────── */}
      {!showUpload && (
        <div style={{
          background: "#f8fafc", border: "1.5px solid #e2e8f0",
          borderRadius: 14, padding: "18px 20px", marginBottom: 28,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12 }}>➕ Add New Vehicle</div>
          <form onSubmit={handleVehicleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
              { name: "vehicleNumber", placeholder: "Vehicle Number (e.g. TS09AB1234)" },
              { name: "vehicleName",   placeholder: "Vehicle Name (e.g. Tata 407)" },
              { name: "capacity",      placeholder: "Capacity (tonnes)" },
            ].map(f => (
              <input key={f.name} name={f.name} value={vehicleForm[f.name]} required
                placeholder={f.placeholder}
                onChange={e => setVehicleForm({ ...vehicleForm, [e.target.name]: e.target.value })}
                style={{
                  flex: "1 1 180px", padding: "9px 12px", borderRadius: 10,
                  border: "1.5px solid #cbd5e1", fontSize: 14, fontFamily: "inherit",
                }}
              />
            ))}
            <button type="submit" style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Add Vehicle</button>
          </form>
        </div>
      )}

      {/* ── Document Upload ─────────────────────────────────────────────────── */}
      {showUpload && (
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "20px 22px", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
            📂 Upload Documents — {uploadingFor}
          </div>
          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
              {[
                { name: "permit",      label: "Vehicle Permit *" },
                { name: "rc",          label: "RC Book *" },
                { name: "fitness",     label: "Fitness Certificate *" },
                { name: "puc",         label: "PUC Certificate *" },
                { name: "insurance",   label: "Insurance *" },
                { name: "vehicleImage",label: "Vehicle Photo *" },
                { name: "tax",         label: "Tax Document *" },
              ].map(f => (
                <label key={f.name} style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  {f.label}
                  <input type="file" name={f.name} required accept="application/pdf,image/*" onChange={handleFileChange}
                    style={{ display: "block", marginTop: 4, border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "4px 8px", width: "100%" }}
                  />
                </label>
              ))}
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Driver Name *
                <input type="text" name="driverName" required onChange={handleFileChange}
                  style={{ display: "block", marginTop: 4, border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", width: "100%", fontFamily: "inherit" }}
                />
              </label>
              {[
                { name: "driverLicence", label: "Driver Licence *" },
                { name: "driverImage",   label: "Driver Photo *" },
              ].map(f => (
                <label key={f.name} style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  {f.label}
                  <input type="file" name={f.name} required accept="application/pdf,image/*" onChange={handleFileChange}
                    style={{ display: "block", marginTop: 4, border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "4px 8px", width: "100%" }}
                  />
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" style={{
                padding: "10px 26px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                color: "#fff", fontWeight: 700, cursor: "pointer",
              }}>Submit Documents</button>
              <button type="button" onClick={() => setShowUpload(false)} style={{
                padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                background: "#fff", color: "#64748b", fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Vehicle Cards ───────────────────────────────────────────────────── */}
      {vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚛</div>
          <div style={{ fontWeight: 600 }}>No vehicles added yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {vehicles.map((v, idx) => {
            const ss  = STATUS_STYLE[v.status] || STATUS_STYLE.Pending;
            const vId = v._id;
            return (
              <div key={vId} style={{
                background: "#fff", borderRadius: 14,
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}>
                {/* Header row */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px", flexWrap: "wrap", gap: 8,
                  borderBottom: "1px solid #f1f5f9",
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                      #{idx + 1} &nbsp;·&nbsp; {v.vehicleNumber}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      {v.vehicleName} &nbsp;|&nbsp; {v.capacity} T capacity
                    </div>
                  </div>
                  <span style={{
                    background: ss.bg, color: ss.color,
                    borderRadius: 20, padding: "4px 14px",
                    fontSize: 12, fontWeight: 700,
                  }}>{ss.label}</span>
                </div>

                {/* Location row */}
                <div style={{ padding: "14px 18px", background: "#f8fafc" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: 0.5 }}>
                    📍 VEHICLE LOCATION
                  </div>

                  {/* Current location chip */}
                  {v.location && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "#eff6ff", border: "1.5px solid #bfdbfe",
                      borderRadius: 20, padding: "4px 12px", fontSize: 13,
                      fontWeight: 700, color: "#1d4ed8", marginBottom: 10,
                    }}>
                      📍 {v.location}
                      {v.lat && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>
                        ({v.lat?.toFixed(2)}, {v.lng?.toFixed(2)})
                      </span>}
                    </div>
                  )}

                  {v.status !== "Activated" ? (
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      ⚠️ Vehicle must be <b>Activated by admin</b> to set location.
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={locInputs[vId] || ""}
                        onChange={e => setLocInputs(prev => ({ ...prev, [vId]: e.target.value }))}
                        style={{
                          flex: "1 1 200px", padding: "9px 12px", borderRadius: 10,
                          border: "1.5px solid #cbd5e1", fontSize: 14,
                          fontFamily: "inherit", background: "#fff",
                        }}
                      >
                        <option value="">— Select New City —</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        onClick={() => handleSaveLocation(vId)}
                        disabled={savingId === vId || !locInputs[vId]}
                        style={{
                          padding: "9px 22px", borderRadius: 10, border: "none",
                          background: savedId === vId
                            ? "linear-gradient(135deg,#16a34a,#22c55e)"
                            : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                          opacity: !locInputs[vId] ? 0.55 : 1,
                          transition: "background 0.3s",
                        }}
                      >
                        {savingId === vId ? "Saving…" : savedId === vId ? "✅ Saved!" : "📍 Update Location"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
