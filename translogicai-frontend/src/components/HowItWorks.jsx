import React from "react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: "📝",
    num: "01",
    title: "Enter Shipment Details",
    desc: "Tell us your pickup city, destination, cargo weight, and urgency. Our AI chat assistant guides you through every step.",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    icon: "💬",
    num: "02",
    title: "Get an Instant AI Quote",
    desc: "Our engine calculates distance, weight, urgency, and weather conditions to give you a real-time, transparent price in seconds.",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: "🤝",
    num: "03",
    title: "Negotiate & Confirm",
    desc: "Not happy with the price? Negotiate directly in the chat. Once you agree, click 'Book Truck Now' to confirm your booking.",
    color: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    icon: "🚛",
    num: "04",
    title: "Driver Gets Notified",
    desc: "Verified drivers within 50km of your pickup location are instantly notified. They review your load details and accept within minutes.",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: "📞",
    num: "05",
    title: "Driver Contacts You",
    desc: "Once a driver accepts, you receive their name and phone number in the chat. You can also call them directly from the tracking page.",
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    icon: "📍",
    num: "06",
    title: "Track Your Shipment Live",
    desc: "Follow your shipment on the tracking page. Get real-time status updates — from Pending → Assigned → In Transit → Delivered.",
    color: "#06b6d4",
    bg: "#ecfeff",
  },
];

const faqs = [
  {
    q: "How is the price calculated?",
    a: "Price = Base Rate × Distance + Weight Factor × Urgency Multiplier. Tolls, TP charges, check-post fees, and driver allowances are all included. GST (5%) is applied on top.",
  },
  {
    q: "How does the 50km driver matching work?",
    a: "Every driver sets their current city when they log in. Our system uses GPS coordinates (Haversine formula) to calculate the exact distance between the driver and your pickup point. Only drivers within 50km are shown your load.",
  },
  {
    q: "What if no driver accepts my load?",
    a: "Your load stays visible to all nearby available drivers. You will be notified automatically in the chat as soon as someone accepts. Most loads are accepted within 5–15 minutes.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. You can cancel a booking before a driver is assigned. Contact our support team if you need to cancel after assignment.",
  },
  {
    q: "Is there a minimum weight for booking?",
    a: "No minimum weight! Whether you're shipping 100kg or 30 tons, TransLogic AI finds the right vehicle for your needs.",
  },
  {
    q: "What types of cargo are supported?",
    a: "General goods, raw materials, industrial equipment, agricultural produce, FMCG, and more. Hazardous or restricted goods require prior approval.",
  },
];

export default function HowItWorks() {
  return (
    <div style={{ background: "#fff", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a8a 0%,#3b82f6 60%,#6d28d9 100%)",
        padding: "80px 20px 70px", textAlign: "center", color: "#fff",
      }}>
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 40,
          padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 20, letterSpacing: 1,
        }}>
          ⚡ SIMPLE & TRANSPARENT
        </div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: 18 }}>
          How TransLogic AI Works
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", maxWidth: 560, margin: "0 auto 32px" }}>
          From quote to delivery in 6 simple steps. No middlemen. No hidden fees. Just smart, transparent logistics.
        </p>
        <Link to="/book" style={{
          display: "inline-block", padding: "14px 36px", borderRadius: 12,
          background: "#fff", color: "#1d4ed8", fontWeight: 800, fontSize: 16,
          textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          Book a Truck Now →
        </Link>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 20px 60px" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 52 }}>
          6 Steps to Get Your Goods Moving
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 28 }}>
          {steps.map(s => (
            <div key={s.num} style={{
              background: s.bg, border: `1.5px solid ${s.color}33`,
              borderRadius: 18, padding: "28px 24px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 44, fontWeight: 900, color: `${s.color}18`,
                fontFamily: "monospace", lineHeight: 1,
              }}>{s.num}</div>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${s.color}20`, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 26, marginBottom: 16,
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Diagram */}
      <div style={{ background: "#f8fafc", padding: "56px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 40 }}>
            The Full Journey
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
            {[
              { label: "Customer\nBooks", icon: "👤", bg: "#dbeafe", color: "#1d4ed8" },
              { arrow: true },
              { label: "AI Calculates\nPrice", icon: "🤖", bg: "#ede9fe", color: "#7c3aed" },
              { arrow: true },
              { label: "Load Posted\nas Pending", icon: "📋", bg: "#fef9c3", color: "#854d0e" },
              { arrow: true },
              { label: "Driver Within\n50km Notified", icon: "🔔", bg: "#dcfce7", color: "#166534" },
              { arrow: true },
              { label: "Driver\nAccepts", icon: "✅", bg: "#ecfdf5", color: "#059669" },
              { arrow: true },
              { label: "Delivery\nComplete", icon: "🎉", bg: "#eff6ff", color: "#1d4ed8" },
            ].map((item, i) =>
              item.arrow ? (
                <div key={i} style={{ fontSize: 22, color: "#94a3b8", margin: "0 4px" }}>→</div>
              ) : (
                <div key={i} style={{
                  background: item.bg, border: `2px solid ${item.color}33`,
                  borderRadius: 14, padding: "14px 16px", textAlign: "center",
                  minWidth: 100, margin: 4,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, whiteSpace: "pre-line", lineHeight: 1.4 }}>{item.label}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 20px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 40 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqs.map((faq, i) => (
            <details key={i} style={{
              background: "#f8fafc", border: "1.5px solid #e2e8f0",
              borderRadius: 14, overflow: "hidden",
            }}>
              <summary style={{
                padding: "18px 20px", fontWeight: 700, fontSize: 15,
                color: "#0f172a", cursor: "pointer", listStyle: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                {faq.q}
                <span style={{ fontSize: 18, color: "#94a3b8", marginLeft: 12 }}>+</span>
              </summary>
              <div style={{
                padding: "0 20px 18px", fontSize: 14, color: "#475569", lineHeight: 1.7,
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
        textAlign: "center", padding: "56px 20px", color: "#fff",
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ready to ship your first load?</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 28 }}>
          Get an instant AI-powered quote in under 30 seconds. No registration required.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/book" style={{
            padding: "13px 32px", borderRadius: 12, background: "#fff",
            color: "#1d4ed8", fontWeight: 800, fontSize: 15, textDecoration: "none",
          }}>🚚 Book a Truck</Link>
          <Link to="/pricing" style={{
            padding: "13px 32px", borderRadius: 12,
            background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
            color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}>💰 View Pricing</Link>
        </div>
      </div>
    </div>
  );
}
