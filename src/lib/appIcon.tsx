import { ImageResponse } from "next/og";
import { brand } from "@/config";

/**
 * Ritar appikonen: varumärkets första bokstav på lila bakgrund.
 * Bokstaven hålls inom mitten så att ikonen fungerar även när
 * telefonen beskär den till en cirkel ("maskable").
 */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.colors.primary,
          color: "white",
          fontSize: size * 0.5,
          fontWeight: 800,
        }}
      >
        {brand.initial}
      </div>
    ),
    { width: size, height: size },
  );
}
