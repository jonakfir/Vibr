import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vibr — Build it. Ship it. Find someone to sell it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        <div style={{ color: "#F2EFE9", fontSize: 72, fontWeight: 300, letterSpacing: "-0.02em" }}>
          Vibr
        </div>
        <div style={{ color: "#8A8580", fontSize: 24, fontWeight: 300, marginTop: 20 }}>
          Build it. Ship it. Find someone to sell it.
        </div>
      </div>
    ),
    { ...size }
  );
}
