import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Les Autres — Drop 001, The Baddies Tee";
export default async function OG() {
  const data = await readFile(
    path.join(process.cwd(), "public/images/drop-001-product.jpeg"),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#111310",
        color: "#efeee8",
        alignItems: "center",
        padding: 50,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "48%" }}>
        <span style={{ fontSize: 18, letterSpacing: 5, color: "#d595a4" }}>
          DROP 001 · LES AUTRES
        </span>
        <span
          style={{
            fontSize: 80,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: 30,
          }}
        >
          THE BADDIES TEE.
        </span>
        <span style={{ fontSize: 19, marginTop: 35 }}>
          SAME PEOPLE. DIFFERENT PERSPECTIVE.
        </span>
      </div>
      <img
        alt="Drop 001"
        src={`data:image/jpeg;base64,${data.toString("base64")}`}
        width={565}
        height={517}
        style={{ objectFit: "cover" }}
      />
    </div>,
    size,
  );
}
