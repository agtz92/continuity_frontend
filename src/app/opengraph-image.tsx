import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const runtime = "edge";
export const alt = "continuu.it — Finish what you start";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#1A1F4D";
const INDIGO = "#3B4A7A";
const OCHRE = "#D4A847";
const CREAM = "#FAF7F2";
const MUTED = "#A8AAB8";

export default async function OpenGraphImage() {
  const t = await getTranslations("landing.meta");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
          color: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 360,
            width: 720,
            height: 520,
            background: `radial-gradient(circle, ${OCHRE}40 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: OCHRE,
            }}
          />
          <div style={{ fontSize: 28, letterSpacing: 2, color: MUTED }}>
            CONTINUU.IT
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.02,
              fontWeight: 300,
              letterSpacing: -2,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            {t("title")}
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.35,
              color: MUTED,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {t("description")}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 24, color: MUTED }}>continuu.it</div>
          <div style={{ fontSize: 24, color: OCHRE }}>Finish what you start.</div>
        </div>
      </div>
    ),
    size
  );
}
