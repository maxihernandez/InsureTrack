import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 112, background: "#065f46", color: "white", fontSize: 240, fontWeight: 750, letterSpacing: -22 }}>PB</div>,
    size,
  );
}
