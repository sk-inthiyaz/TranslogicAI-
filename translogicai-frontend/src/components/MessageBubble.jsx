import React from "react";

export function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0
      }}>🤖</div>
      <div style={{
        background: "#f1f5f9", borderRadius: "18px 18px 18px 4px",
        padding: "12px 18px", display: "flex", gap: 5, alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: "#94a3b8",
            display: "inline-block",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ text, sender, time, isTrackCard }) {
  const isUser = sender === "user";

  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 4,
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        {isUser ? "👤" : "🤖"}
      </div>

      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
            : "#f1f5f9",
          color: isUser ? "#fff" : "#1e293b",
          padding: "11px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontSize: 13.5,
          lineHeight: 1.55,
          boxShadow: isUser
            ? "0 4px 14px rgba(59,130,246,0.25)"
            : "0 2px 8px rgba(0,0,0,0.07)",
        }} dangerouslySetInnerHTML={{ __html: formattedText }} />

        {/* Track Shipment Card — shown when driver accepts */}
        {isTrackCard && (
          <a
            href="/track"
            style={{
              marginTop: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 20px", borderRadius: 12, textDecoration: "none",
              background: "linear-gradient(135deg,#0ea5e9,#06b6d4)",
              color: "#fff", fontWeight: 700, fontSize: 13.5,
              boxShadow: "0 4px 16px rgba(6,182,212,0.35)",
              width: "100%",
            }}
          >
            📍 Track Your Shipment →
          </a>
        )}

        {time && (
          <span style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3, paddingLeft: 4 }}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;

