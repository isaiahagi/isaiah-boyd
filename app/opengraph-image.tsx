import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const dynamic = "force-static";
export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 88,
          background: "#ffffff",
          color: "#000000",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#444444" }}>isaiahboyd.xyz</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 112 }}>{site.name}</div>
          <div style={{ display: "flex", fontSize: 36, color: "#444444", marginTop: 20 }}>{site.role}</div>
        </div>
        <div
          style={{ display: "flex", borderTop: "1px solid #cccccc", paddingTop: 32, fontSize: 28, color: "#444444" }}
        >
          {site.location}
        </div>
      </div>
    ),
    size,
  );
}
