import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/LogoMark";

/**
 * Ritar appikonen (logotypen). Motivet ligger inom mitten så att ikonen fungerar
 * även när telefonen beskär den till en cirkel ("maskable").
 */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <LogoMark size={size} />
      </div>
    ),
    { width: size, height: size },
  );
}
