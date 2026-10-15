import { renderAppIcon } from "@/lib/appIcon";

/** Ikonen som iPhone använder när sidan läggs på hemskärmen. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(180);
}
