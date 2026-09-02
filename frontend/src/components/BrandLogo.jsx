import bceaoEmblem from "../assets/bceao-emblem.png";

export function BceaoEmblemIcon({ size = 26 }) {
  return (
    <img
      src={bceaoEmblem}
      alt="Emblème BCEAO"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

export function BrandLogo({
  name = "WariFact",
  size = "md",
  showText = true,
  textColor = "var(--text-main)",
  tagline = null,
}) {
  const iconSizes = {
    sm: 20,
    md: 26,
    lg: 38,
    xl: 48,
  };

  const badgeSizes = {
    sm: { width: "32px", height: "32px", borderRadius: "8px" },
    md: { width: "42px", height: "42px", borderRadius: "10px" },
    lg: { width: "58px", height: "58px", borderRadius: "14px" },
    xl: { width: "72px", height: "72px", borderRadius: "18px" },
  };

  const fontSizes = {
    sm: "16px",
    md: "20px",
    lg: "26px",
    xl: "32px",
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
      <div
        className="navbar-logo-icon"
        style={{
          ...badgeSizes[size],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
          padding: "4px",
          flexShrink: 0,
        }}
      >
        <BceaoEmblemIcon size={iconSizes[size]} />
      </div>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: fontSizes[size],
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: textColor,
            }}
          >
            {name}
          </span>
          {tagline && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
