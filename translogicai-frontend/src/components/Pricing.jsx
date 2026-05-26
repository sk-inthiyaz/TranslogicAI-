import React, { useState, useEffect } from "react";

// ─── All cities (no state distinction) ──────────────────────────────────────
const ALL_CITIES = [
  "Adoni","Ahmedabad","Anantapur","Bengaluru","Bhimavaram","Bhopal",
  "Bhubaneswar","Chennai","Chittoor","Coimbatore","Cuddapah","Cuttack",
  "Delhi","Dharmavaram","Eluru","Guntur","Guntakal","Hindupur","Hubballi",
  "Hyderabad","Indore","Jaipur","Kadapa","Kakinada","Karimnagar","Khammam",
  "Kochi","Kolkata","Kurnool","Lucknow","Machilipatnam","Madurai","Mahbubnagar",
  "Mandya","Mangaluru","Medak","Miryalaguda","Mumbai","Mysuru","Nagpur",
  "Nalgonda","Nandyal","Narasaraopet","Nellore","Nizamabad","Ongole","Patna",
  "Proddatur","Pune","Rajahmundry","Ranchi","Raipur","Sangareddy","Siddipet",
  "Srikakulam","Surat","Suryapet","Tadepalligudem","Tenali","Thiruvananthapuram",
  "Tirupati","Vadodara","Vijayawada","Visakhapatnam","Vizianagaram","Warangal",
].sort();

// ─── Distance table (approx km) ──────────────────────────────────────────────
const DISTANCE_MAP = {
  "Hyderabad-Vijayawada": 275, "Hyderabad-Visakhapatnam": 625,
  "Hyderabad-Warangal": 148,  "Hyderabad-Guntur": 285,
  "Hyderabad-Nellore": 458,   "Hyderabad-Tirupati": 568,
  "Hyderabad-Kurnool": 213,   "Hyderabad-Rajahmundry": 466,
  "Hyderabad-Kakinada": 527,  "Hyderabad-Karimnagar": 164,
  "Hyderabad-Mumbai": 711,    "Hyderabad-Delhi": 1490,
  "Hyderabad-Chennai": 626,   "Hyderabad-Bengaluru": 570,
  "Hyderabad-Kolkata": 1500,  "Hyderabad-Pune": 559,
  "Vijayawada-Visakhapatnam": 352, "Vijayawada-Guntur": 34,
  "Vijayawada-Nellore": 283,  "Vijayawada-Tirupati": 378,
  "Vijayawada-Rajahmundry": 192,   "Vijayawada-Kakinada": 253,
  "Vijayawada-Chennai": 432,  "Vijayawada-Bengaluru": 530,
  "Visakhapatnam-Chennai": 802,"Visakhapatnam-Kolkata": 948,
  "Chennai-Bengaluru": 346,   "Mumbai-Pune": 149,
  "Delhi-Jaipur": 281,        "Bengaluru-Mysuru": 148,
};

function getDistance(from, to) {
  return DISTANCE_MAP[`${from}-${to}`] || DISTANCE_MAP[`${to}-${from}`] || null;
}

// ─── Pricing engine — matches backend calculatePrice.js ──────────────────
// Weight-tier rate per km (based on real Indian trucking costs)
function getVehicleInfo(tons) {
  const kg = parseFloat(tons) * 1000;
  if (kg <= 500)   return { type: "Mini Van",         ratePerKm: 15, icon: "🚐" };
  if (kg <= 3000)  return { type: "Pickup Truck",     ratePerKm: 25, icon: "🛻" };
  if (kg <= 7000)  return { type: "LCV",              ratePerKm: 35, icon: "🚛" };
  if (kg <= 15000) return { type: "Full Truckload",   ratePerKm: 46, icon: "🚚" };
  return            { type: "Heavy Truck",   ratePerKm: 62, icon: "🏗️" };
}

function calculatePrice(from, to, tons, distanceKm, urgency = "Medium") {
  const t = parseFloat(tons) || 1;
  const d = parseFloat(distanceKm) || 0;
  const vehicle = getVehicleInfo(t);

  // Base freight = distance × rate per km (weight-tier)
  const baseFreight = Math.round(d * vehicle.ratePerKm);

  // Urgency multiplier
  const urgencyFactors = { Low: 1.0, Medium: 1.15, High: 1.3 };
  const urgFactor = urgencyFactors[urgency] || 1.15;
  const urgencySurcharge = Math.round(baseFreight * (urgFactor - 1));

  // Tolls: ₹1.8/km highway average for trucks
  const tollCharges = Math.round(d * 1.8);

  // Driver allowance: ₹600/day, 1 day per 400 km
  const driverAllowance = Math.ceil(d / 400) * 600;

  const subtotal = baseFreight + urgencySurcharge + tollCharges + driverAllowance;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  return {
    baseFreight,
    urgencySurcharge,
    urgencyLabel: urgency,
    tollCharges,
    driverAllowance,
    gst,
    total: Math.max(500, total),
    perKm: d > 0 ? (total / d).toFixed(1) : "—",
    perTon: t > 0 ? Math.round(total / t) : "—",
    vehicleType: vehicle.type,
    vehicleIcon: vehicle.icon,
    ratePerKm: vehicle.ratePerKm,
  };
}

// ─── Styles (white/light theme) ──────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    color: "#1e293b",
    paddingBottom: 72,
  },
  hero: {
    textAlign: "center",
    padding: "52px 16px 28px",
    background: "linear-gradient(180deg,#f0f7ff 0%,#ffffff 100%)",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 40,
  },
  chip: {
    display: "inline-block",
    background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "4px 14px",
    borderRadius: 20,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "clamp(1.8rem,4vw,2.8rem)",
    fontWeight: 800,
    margin: "0 0 12px",
    color: "#0f172a",
    lineHeight: 1.2,
  },
  heroSub: {
    fontSize: 15,
    color: "#64748b",
    maxWidth: 520,
    margin: "0 auto",
    lineHeight: 1.7,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "28px 24px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  select: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    color: "#1e293b",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg fill='%2364748b' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    color: "#1e293b",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
    letterSpacing: 0.4,
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#334155",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Pricing() {
  const [from, setFrom] = useState("Hyderabad");
  const [to, setTo]     = useState("Vijayawada");
  const [tons, setTons] = useState("10");
  const [dist, setDist] = useState("275");
  const [urgency, setUrgency] = useState("High");
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [animating, setAnimating] = useState(false);

  // Auto-fill known distance
  useEffect(() => {
    const d = getDistance(from, to);
    if (d) setDist(String(d));
    else setDist("");
  }, [from, to]);

  const handleCalc = () => {
    setError("");
    if (from === to) { setError("Origin and destination cannot be the same."); return; }
    if (!parseFloat(tons) || parseFloat(tons) <= 0) { setError("Enter a valid weight in tons."); return; }
    if (!parseFloat(dist) || parseFloat(dist) <= 0) { setError("Enter the distance in km."); return; }
    setLoading(true);
    setTimeout(() => {
      setResult(calculatePrice(from, to, tons, dist, urgency));
      setLoading(false);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }, 700);
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const EXAMPLES = [
    { from:"Hyderabad",   to:"Vijayawada",    tons:10, dist:275, urg:"High",   label:"Hyd → Vijayawada (10T)"  },
    { from:"Hyderabad",   to:"Visakhapatnam", tons:8,  dist:625, urg:"Medium", label:"Hyd → Vizag (8T)"         },
    { from:"Vijayawada",  to:"Chennai",       tons:5,  dist:432, urg:"Low",    label:"Vjw → Chennai (5T)"      },
    { from:"Hyderabad",   to:"Kurnool",       tons:10, dist:213, urg:"High",   label:"Hyd → Kurnool (10T)"     },
    { from:"Hyderabad",   to:"Mumbai",        tons:20, dist:711, urg:"High",   label:"Hyd → Mumbai (20T)"      },
  ];

  return (
    <div style={S.page}>

      {/* ── Hero ── */}
      <div style={S.hero}>
        <div style={S.chip}>Transparent Pricing</div>
        <h1 style={S.heroTitle}>Know Your Freight Cost<br />Before You Book</h1>
        <p style={S.heroSub}>
          Instant estimates based on distance, weight &amp; standard charges.
          Every route includes TP, check-post &amp; toll fees — fully transparent, no surprises.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

        {/* ── Info banner ── */}
        <div style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12, padding: "14px 20px", marginBottom: 32,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 22, marginTop: 2 }}>💡</span>
          <div>
            <strong style={{ color: "#1d4ed8", fontSize: 14 }}>How Pricing Works</strong>
            <p style={{ color: "#475569", fontSize: 13, margin: "4px 0 0", lineHeight: 1.6 }}>
              Price is calculated based on your load weight (which determines the vehicle tier and rate per km),
              urgency level, and weather conditions. A 10-ton load at 300 km with High urgency costs around ₹18,000 — 
              matching real Indian trucking rates. Tolls, driver allowance &amp; 5% GST are added on top.
            </p>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* Calculator */}
          <div style={S.card}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#0f172a" }}>
              🧮 Price Calculator
            </h2>

            {/* Quick examples */}
            <div style={{ marginBottom: 20 }}>
              <div style={S.label}>Quick examples</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {EXAMPLES.map(ex => (
                  <button key={ex.label}
                    onClick={() => { setFrom(ex.from); setTo(ex.to); setTons(String(ex.tons)); setDist(String(ex.dist)); setUrgency(ex.urg); setResult(null); }}
                    style={{
                      padding: "5px 13px", borderRadius: 20,
                      border: "1.5px solid #bfdbfe", background: "#eff6ff",
                      color: "#1d4ed8", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}
                  >{ex.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={S.label}>From 📍</label>
                <select style={S.select} value={from} onChange={e => setFrom(e.target.value)}>
                  {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>To 🏁</label>
                <select style={S.select} value={to} onChange={e => setTo(e.target.value)}>
                  {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Weight (Tons) 🏋️</label>
                <input style={S.input} type="number" min="0.5" max="40" step="0.5"
                  value={tons} onChange={e => setTons(e.target.value)} placeholder="e.g. 10" />
              </div>
              <div>
                <label style={S.label}>Distance (km) 📏</label>
                <input style={S.input} type="number" min="1"
                  value={dist} onChange={e => setDist(e.target.value)} placeholder="Auto-filled / enter manually" />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Urgency 🚨</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Low", "Medium", "High"].map(u => (
                  <button key={u} onClick={() => setUrgency(u)} style={{
                    flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer",
                    fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                    border: urgency === u ? "2px solid #3b82f6" : "1.5px solid #e2e8f0",
                    background: urgency === u
                      ? (u === "High" ? "#fef2f2" : u === "Medium" ? "#fffbeb" : "#f0fdf4")
                      : "#f8fafc",
                    color: urgency === u
                      ? (u === "High" ? "#dc2626" : u === "Medium" ? "#d97706" : "#16a34a")
                      : "#94a3b8",
                  }}>
                    {u === "High" ? "🔥 " : u === "Medium" ? "⚡ " : "🐢 "}{u}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                padding: "9px 13px", marginBottom: 12, color: "#b91c1c", fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <button style={{ ...S.btn, opacity: loading ? 0.75 : 1 }}
              onClick={handleCalc} disabled={loading}>
              {loading ? "⚡ Calculating..." : "⚡ Get Price Estimate"}
            </button>
          </div>

          {/* Result */}
          <div style={{
            ...S.card,
            opacity: result ? 1 : 0.5,
            transform: animating ? "scale(1.015)" : "scale(1)",
            transition: "all 0.35s ease",
          }}>
            {!result ? (
              <div style={{ textAlign: "center", padding: "56px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🚛</div>
                <div style={{ fontSize: 15 }}>Fill the form &amp; click<br />
                  <strong style={{ color: "#3b82f6" }}>Get Price Estimate</strong>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>
                  📋 Price Breakdown
                </h2>

                {/* Route pill */}
                {/* Route + Vehicle pill */}
                <div style={{
                  background: "#f0f9ff", border: "1px solid #bae6fd",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 12,
                  display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                }}>
                  <span style={{ fontSize: 13, color: "#0369a1", fontWeight: 600 }}>
                    {from} → {to}
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    📏 {dist} km &nbsp;|&nbsp; 🏋️ {tons} tons
                  </span>
                </div>

                {/* Vehicle type */}
                <div style={{
                  background: "#f0fdf4", border: "1px solid #86efac",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 18,
                  textAlign: "center", fontWeight: 700, fontSize: 14, color: "#166534",
                }}>
                  {result.vehicleIcon} Vehicle: {result.vehicleType} — ₹{result.ratePerKm}/km
                </div>

                {/* Breakdown */}
                <div style={S.breakdownRow}>
                  <span>🚚 Base Freight ({dist} km × ₹{result.ratePerKm}/km)</span>
                  <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{fmt(result.baseFreight)}</span>
                </div>
                {result.urgencySurcharge > 0 && (
                  <div style={S.breakdownRow}>
                    <span>🔥 Urgency Surcharge ({result.urgencyLabel})</span>
                    <span style={{ fontWeight: 700, color: "#dc2626" }}>{fmt(result.urgencySurcharge)}</span>
                  </div>
                )}
                <div style={S.breakdownRow}>
                  <span>🛣️ Toll Charges</span>
                  <span style={{ fontWeight: 700, color: "#b45309" }}>{fmt(result.tollCharges)}</span>
                </div>
                <div style={S.breakdownRow}>
                  <span>🛏️ Driver Allowance</span>
                  <span style={{ fontWeight: 700, color: "#b45309" }}>{fmt(result.driverAllowance)}</span>
                </div>
                <div style={S.breakdownRow}>
                  <span>🧾 GST (5%)</span>
                  <span style={{ fontWeight: 700, color: "#64748b" }}>{fmt(result.gst)}</span>
                </div>

                {/* Total */}
                <div style={{
                  marginTop: 14,
                  background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
                  borderRadius: 12, padding: "16px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  color: "#fff",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>💰 Total Estimate</span>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{fmt(result.total)}</span>
                </div>

                {/* Per-unit */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3, fontWeight: 600 }}>PER KM</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#3b82f6" }}>₹{result.perKm}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3, fontWeight: 600 }}>PER TON</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#0891b2" }}>₹{result.perTon}</div>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12, textAlign: "center" }}>
                  * Estimate only. Final chatbot price may vary based on real-time weather &amp; route conditions.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── What's included cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18, marginTop: 40 }}>
          {[
            { icon: "🚚", title: "Weight-Tier Pricing", desc: "Rate per km depends on load weight: Mini Van (₹15/km), Pickup (₹25/km), LCV (₹35/km), FTL (₹46/km), Heavy (₹62/km).", color: "#1d4ed8" },
            { icon: "🔥", title: "Urgency Surcharge", desc: "Low: standard rate. Medium: +15% priority. High: +30% for immediate dispatch.", color: "#dc2626" },
            { icon: "🛣️", title: "Toll Charges", desc: "National & state highway toll charges at ₹1.8/km average for trucks.", color: "#b45309" },
            { icon: "🌧️", title: "Weather Surcharge", desc: "Rain +10%, Storm +15%. Clear weather has no surcharge.", color: "#0f766e" },
            { icon: "🧾", title: "GST (5%)", desc: "Goods Transport Agency 5% GST as per Indian tax law.", color: "#64748b" },
          ].map(item => (
            <div key={item.title} style={{ ...S.card, padding: "20px 18px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: item.color }}>{item.title}</h3>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Reference table ── */}
        <div style={{ ...S.card, marginTop: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, color: "#0f172a" }}>
            📊 Vehicle & Rate Reference
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Vehicle Type", "Max Weight", "Rate / km", "Example: 300 km (High)"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px",
                      borderBottom: "2px solid #e2e8f0", color: "#3b82f6", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["🚐 Mini Van",       "500 kg (0.5T)",   "₹15",  `₹${Math.round(300 * 15 * 1.3)}`],
                  ["🛻 Pickup Truck",   "3,000 kg (3T)",   "₹25",  `₹${Math.round(300 * 25 * 1.3)}`],
                  ["🚛 LCV",            "7,000 kg (7T)",   "₹35",  `₹${Math.round(300 * 35 * 1.3)}`],
                  ["🚚 Full Truckload", "15,000 kg (15T)",  "₹46", `₹${Math.round(300 * 46 * 1.3)}`],
                  ["🏗️ Heavy Truck",    "25,000+ kg",      "₹62",  `₹${Math.round(300 * 62 * 1.3)}`],
                ].map(([veh, wt, rate, example], i) => (
                  <tr key={veh} style={{ background: i % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{veh}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{wt}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1d4ed8", borderBottom: "1px solid #f1f5f9" }}>{rate}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9" }}>{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12, textAlign: "center" }}>
            Example prices are base freight × High urgency (1.3×) only. Final price includes tolls, driver allowance, weather surcharge &amp; GST.
          </p>
        </div>

        {/* ── CTA ── */}
        <div style={{
          textAlign: "center", marginTop: 48,
          background: "linear-gradient(135deg,#eff6ff,#f0fdf4)",
          border: "1px solid #bfdbfe", borderRadius: 18, padding: "40px 20px",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#0f172a" }}>Ready to Ship?</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Lock in your price and book a verified driver in minutes.</p>
          <a href="/book" style={{
            display: "inline-block", padding: "13px 36px", borderRadius: 12,
            background: "linear-gradient(90deg,#3b82f6,#06b6d4)", color: "#fff",
            fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
          }}>🚛 Book a Truck Now</a>
        </div>

      </div>
    </div>
  );
}
