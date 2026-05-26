import React, { useState, useEffect } from "react";

import API_BASE from "../config/api";
export default function DriverContact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill from driver data
  useEffect(() => {
    const dd = JSON.parse(localStorage.getItem("driverData") || "null");
    if (dd) {
      setForm(prev => ({
        ...prev,
        name: dd.fullName || prev.name,
        phone: dd.phone || prev.phone,
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const dd = JSON.parse(localStorage.getItem("driverData") || "null");
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          senderType: "driver",
          senderId: dd?._id || dd?.id || null,
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

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #334155", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
    background: "#1e293b", color: "#f1f5f9",
  };

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'Inter', sans-serif",
      background: "linear-gradient(180deg, #0f172a, #1e293b)",
      color: "#f1f5f9",
    }}>
      {/* Hero */}
      <div style={{
        textAlign: "center", padding: "52px 20px 36px",
        borderBottom: "1px solid #334155",
      }}>
        <div style={{
          display: "inline-block", background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.3)", borderRadius: 40,
          padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 18,
          letterSpacing: 1, color: "#60a5fa",
        }}>
          📞 DRIVER SUPPORT
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
          Need Help?
        </h1>
        <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 500, margin: "0 auto" }}>
          Having issues with loads, documents, payments, or your account? Reach out and our team will help you.
        </p>
      </div>

      {/* Contact cards */}
      <div style={{ maxWidth: 800, margin: "-24px auto 0", padding: "0 20px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          {[
            { icon: "📞", label: "Phone", value: "+91 9876 543 210", href: "tel:+919876543210" },
            { icon: "✉️", label: "Email", value: "support@translogicai.in", href: "mailto:support@translogicai.in" },
            { icon: "💬", label: "WhatsApp", value: "Chat with us", href: "https://wa.me/919876543210" },
          ].map(c => (
            <a key={c.label} href={c.href} style={{
              background: "#1e293b", borderRadius: 14, padding: "18px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: "1px solid #334155",
              textAlign: "center", textDecoration: "none",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", marginBottom: 4, letterSpacing: 0.5 }}>{c.label.toUpperCase()}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#60a5fa" }}>{c.value}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 600, margin: "40px auto 60px", padding: "0 20px" }}>
        <div style={{
          background: "#0f172a", border: "1.5px solid #334155",
          borderRadius: 18, padding: "28px 24px",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
            ✉️ Send a Message
          </h2>

          {submitted ? (
            <div style={{
              background: "rgba(34,197,94,0.1)", border: "1.5px solid #22c55e",
              borderRadius: 14, padding: 28, textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#22c55e", marginBottom: 8 }}>Message Sent!</div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>
                Our support team will get back to you within 2 hours.
              </div>
              <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                style={{ marginTop: 18, padding: "10px 24px", borderRadius: 10, border: "none",
                  background: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { name: "name",    label: "Full Name",     type: "text",  placeholder: "Your full name",       required: true },
                { name: "email",   label: "Email Address", type: "email", placeholder: "you@example.com",      required: false },
                { name: "phone",   label: "Phone Number",  type: "tel",   placeholder: "+91 9876 543 210",     required: true },
                { name: "subject", label: "Subject",       type: "text",  placeholder: "e.g. Load issue, Payment query…", required: true },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                    {f.label} {f.required && <span style={{ color: "#dc2626" }}>*</span>}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={form[f.name]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#3b82f6"}
                    onBlur={e => e.target.style.borderColor = "#334155"}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                  Message <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or question…"
                  required
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#334155"}
                />
              </div>
              {error && (
                <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid #dc2626", borderRadius: 8,
                  padding: "9px 13px", color: "#fca5a5", fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}
              <button type="submit" disabled={submitting} style={{
                padding: "13px", borderRadius: 12, border: "none",
                background: submitting ? "#475569" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                color: "#fff", fontWeight: 800, fontSize: 15,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
              }}>
                {submitting ? "Sending..." : "Send Message →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

