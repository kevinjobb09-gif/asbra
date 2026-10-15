import Link from "next/link";
import { brand } from "@/config";
import { ButtonLink } from "./ButtonLink";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-primary">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            {brand.initial}
          </span>
          {brand.name}
        </Link>
        <ButtonLink href="/ova" variant="cta" className="!px-4 !py-2 text-sm">
          Börja öva
        </ButtonLink>
      </div>
    </header>
  );
}
