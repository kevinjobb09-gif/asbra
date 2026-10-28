"use client";

import { useState } from "react";
import { Copy, Mail } from "lucide-react";
import { useI18n } from "@/i18n/client";

const button = "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 font-bold transition-colors";

export function CopyEmail({ email }: { email: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Urklipp nekat – adressen går fortfarande att markera och kopiera för hand.
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={copy} className={`${button} bg-primary text-white hover:bg-primary-dark`}>
        <Copy size={18} aria-hidden />
        <span aria-live="polite">{copied ? t("contact.copied") : t("contact.copy")}</span>
      </button>
      <a href={`mailto:${email}`} className={`${button} border-2 border-line bg-surface text-ink hover:border-primary`}>
        <Mail size={18} aria-hidden />
        {t("contact.write")}
      </a>
    </div>
  );
}
