import React from "react";

function Footer() {
  const links = {
    "Quick Links": [
      { label: "Home",           href: "/" },
      { label: "Book a Truck",   href: "/book" },
      { label: "Track Shipment", href: "/track" },
      { label: "Pricing",        href: "/pricing" },
      { label: "For Drivers",    href: "/drivers" },
      { label: "Contact Us",     href: "/contact" },
    ],
    "Company": [
      { label: "About Us",      href: "/about" },
      { label: "How It Works",  href: "/how-it-works" },
      { label: "Careers",       href: "/careers" },
      { label: "Blog",          href: "/blog" },
    ],
    "Support": [
      { label: "Help Center",              href: "/help" },
      { label: "FAQs",                     href: "/faq" },
      { label: "Terms & Conditions",       href: "/terms" },
      { label: "Privacy Policy",           href: "/privacy" },
      { label: "Cancellation & Refund",    href: "/refund" },
    ],
  };

  const linkStyle = {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: 14,
    lineHeight: "2",
    display: "block",
  };

  return (
    <footer style={{
      background: "#fbfbfbff",
      borderTop: "1px solid #1e293b",
      paddingTop: 48,
      paddingBottom: 0,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 24px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 36,
      }}>
        {/* Brand column */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 10 }}>
            🚛 TransLogic AI
          </div>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
            India's smartest logistics platform — instant quotes, real-time tracking, AI-powered matching.
          </p>
          <div style={{ color: "#475569", fontSize: 12 }}>
            📍 Hyderabad, India<br />
            📞 <a href="tel:+919999999999" style={{ color: "#60a5fa", textDecoration: "none" }}>+91 99999 99999</a>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(links).map(([title, items]) => (
          <div key={title}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", marginBottom: 12, letterSpacing: 0.5 }}>
              {title.toUpperCase()}
            </div>
            {items.map(({ label, href }) => (
              <a key={label} href={href} style={linkStyle}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "#94a3b8"}
              >
                {label}
              </a>
            ))}
          </div>
        ))}

        {/* Connect column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", marginBottom: 12, letterSpacing: 0.5 }}>
            CONNECT
          </div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            {[
              { icon: "🟢", href: "https://wa.me/919999999999", label: "WhatsApp" },
              { icon: "📘", href: "https://facebook.com",       label: "Facebook" },
              { icon: "📸", href: "https://instagram.com",      label: "Instagram" },
              { icon: "💼", href: "https://linkedin.com",       label: "LinkedIn" },
              { icon: "🐦", href: "https://twitter.com",        label: "Twitter" },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                style={{ fontSize: 20, textDecoration: "none" }}
              >
                {s.icon}
              </a>
            ))}
          </div>
          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.8 }}>
            GSTIN: 29ABCDE1234F2Z5<br />
            Registered Office: Hyderabad, India
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid #1e293b",
        textAlign: "center",
        padding: "14px 24px",
        color: "#475569",
        fontSize: 12,
      }}>
        © {new Date().getFullYear()} TransLogic AI. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
