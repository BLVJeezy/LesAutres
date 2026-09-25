import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#171a13",
        color: "#eee",
        fontSize: 100,
        fontWeight: 900,
        alignItems: "center",
        justifyContent: "center",
        fontStyle: "italic",
      }}
    >
      LA
    </div>,
    size,
  );
}
