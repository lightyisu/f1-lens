import { ImageResponse } from "next/og";

export const alt = "F1 Lens";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 55%, #ececee 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#0a0a0a" }}>F1</span>
          <span style={{ color: "#e10600" }}>Lens</span>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 34,
            color: "#52525b",
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Schedules, results, and session analysis — clean and minimal.
        </div>
        <div
          style={{
            marginTop: 48,
            width: 96,
            height: 6,
            background: "#e10600",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
