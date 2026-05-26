import React, { useState, useEffect } from "react";
import API_BASE from "../config/api";
import { Link } from "react-router-dom";

const contactMethods = [
  { icon: "📞", label: "Phone", value: "+91 9876 543 210", sub: "Mon–Sat, 8 AM – 8 PM", href: "tel:+919876543210" },
  { icon: "✉️", label: "Email", value: "support@translogicai.in", sub: "We reply within 2 hours", href: "mailto:support@translogicai.in" },
  { icon: "📍", label: "Office", value: "Hyderabad, Telangana", sub: "Serving PAN India", href: null },
  { icon: "💬", label: "WhatsApp", value: "Chat with us", sub: "Fastest response", href: "https://wa.me/919876543210" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill from customer data
  useEffect(() => {
    const cd = JSON.parse(localStorage.getItem("customerData") || "null");
    if (cd) {
      setForm(prev => ({
        ...prev,
        name: cd.fullName || cd.name || prev.name,
        phone: cd.phone || prev.phone,
        email: cd.email || prev.email,
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const cd = JSON.parse(localStorage.getItem("customerData") || "null");
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          senderType: "customer",
          senderId: cd?._id || cd?.id || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ background: "#fff", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#3b82f6 100%)",
        padding: "72px 20px 60px", textAlign: "center", color: "#fff",
      }}>
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)", borderRadius: 40,
          padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 18, letterSpacing: 1,
        }}>
          📞 SUPPORT & ENQUIRIES
        </div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
          Get in Touch
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "0 auto" }}>
          Have questions about pricing, driver registration, or your shipment? Our team is here to help.
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{ maxWidth: 940, margin: "-36px auto 0", padding: "0 20px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {contactMethods.map(c => (
            <div key={c.label} style={{
              background: "#fff", borderRadius: 16, padding: "22px 20px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.10)", border: "1px solid #f1f5f9",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#94a3b8", marginBottom: 4, letterSpacing: 0.5 }}>{c.label.toUpperCase()}</div>
              {c.href ? (
                <a href={c.href} style={{ fontWeight: 700, fontSize: 15, color: "#1d4ed8", textDecoration: "none" }}>{c.value}</a>
              ) : (
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{c.value}</div>
              )}
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content: Form + Info */}
      <div style={{ maxWidth: 940, margin: "48px auto 60px", padding: "0 20px", display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Contact Form */}
        <div style={{ flex: "1 1 400px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>
            Send us a Message
          </h2>

          {submitted ? (
            <div style={{
              background: "#dcfce7", border: "1.5px solid #86efac",
              borderRadius: 16, padding: 32, textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#166534", marginBottom: 8 }}>Message Sent!</div>
              <div style={{ color: "#166534", fontSize: 14 }}>
                Thank you for reaching out. Our team will get back to you within 2 hours.
              </div>
              <button onClick={() => { setSubmitted(false); setForm({ name:"", email:"", phone:"", subject:"", message:"" }); }}
                style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, border: "none",
                  background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { name: "name",    label: "Full Name",     type: "text",  placeholder: "Your full name",       required: true },
                { name: "email",   label: "Email Address", type: "email", placeholder: "you@example.com",      required: true },
                { name: "phone",   label: "Phone Number",  type: "tel",   placeholder: "+91 9876 543 210",     required: false },
                { name: "subject", label: "Subject",       type: "text",  placeholder: "e.g. Booking issue, Driver registration…", required: true },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                    {f.label} {f.required && <span style={{ color: "#dc2626" }}>*</span>}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={form[f.name]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 10,
                      border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = "#3b82f6"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                  Message <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or question in detail…"
                  required
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "9px 13px", color: "#b91c1c", fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}
              <button type="submit" disabled={submitting} style={{
                padding: "13px", borderRadius: 12, border: "none",
                background: submitting ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(59,130,246,0.35)",
              }}>
                {submitting ? "Sending..." : "Send Message →"}
              </button>
            </form>
          )}
        </div>

        {/* Info Panel */}
        <div style={{ flex: "0 1 300px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>
            Quick Help
          </h2>

          {[
            {
              title: "🚚 Booking Help",
              desc: "Having trouble booking? Chat with our AI at /book or call us directly.",
              link: "/book", linkLabel: "Go to Booking →",
            },
            {
              title: "📍 Track Shipment",
              desc: "Your shipment details are stored automatically. Visit Track page for live updates.",
              link: "/track", linkLabel: "Track Now →",
            },
            {
              title: "💰 Pricing Query",
              desc: "Calculate exact freight costs for any route using our interactive pricing calculator.",
              link: "/pricing", linkLabel: "View Pricing →",
            },
            {
              title: "🚛 Driver Support",
              desc: "Trouble with loads, documents, or payments? Log in to the driver portal.",
              link: "/driver/home", linkLabel: "Driver Portal →",
            },
          ].map(item => (
            <div key={item.title} style={{
              background: "#f8fafc", border: "1.5px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", marginBottom: 14,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10, lineHeight: 1.6 }}>{item.desc}</div>
              <Link to={item.link} style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", textDecoration: "none" }}>
                {item.linkLabel}
              </Link>
            </div>
          ))}

          {/* Business Hours */}
          <div style={{
            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
            border: "1.5px solid #93c5fd", borderRadius: 14, padding: "18px",
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#1e40af", marginBottom: 12 }}>🕐 Business Hours</div>
            {[
              ["Monday – Friday", "8:00 AM – 8:00 PM"],
              ["Saturday",        "9:00 AM – 6:00 PM"],
              ["Sunday",          "Emergency only"],
            ].map(([day, time]) => (
              <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>{day}</span>
                <span style={{ color: "#1e3a8a", fontWeight: 700 }}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

