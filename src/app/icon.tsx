import { renderAppIcon } from "@/lib/appIcon";

const sizes = [32, 192, 512];

/** Skapar /icon/32, /icon/192 och /icon/512. */
export function generateImageMetadata() {
  return sizes.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return renderAppIcon(Number(await id));
}
