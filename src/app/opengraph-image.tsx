import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b0b0c",
          color: "#f5f3ee",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -160,
            width: 480,
            height: 480,
            borderRadius: "48% 52% 55% 45% / 45% 48% 52% 55%",
            background:
              "radial-gradient(circle at 65% 35%, #ff8a68 0%, #ff5a36 45%, #7a1f0e 100%)",
            display: "flex",
          }}
        />
        <p
          style={{
            fontSize: 28,
            textTransform: "uppercase",
            letterSpacing: 8,
            color: "#8a8a86",
            margin: 0,
          }}
        >
          Aashish Pandey
        </p>
        <p
          style={{
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.15,
            margin: "24px 0 0",
            maxWidth: 640,
          }}
        >
          I keep complex delivery{" "}
          <span style={{ color: "#ff5a36" }}>shipping on schedule.</span>
        </p>
      </div>
    ),
    { ...size }
  );
}
