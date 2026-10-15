import Link from "next/link";
import { brand } from "@/config";
import { Disclaimer } from "./Disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Disclaimer />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/villkor" className="hover:text-primary">Användarvillkor</Link>
          <Link href="/integritet" className="hover:text-primary">Integritetspolicy</Link>
          <Link href="/om" className="hover:text-primary">Om oss</Link>
          <a href={`mailto:${brand.contactEmail}`} className="hover:text-primary">Kontakt</a>
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {brand.company.legalName}
        </p>
      </div>
    </footer>
  );
}
